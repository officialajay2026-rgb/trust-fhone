#!/usr/bin/env python3
"""
OCR Helper for TrustFhone Delhi
Uses emergentintegrations to analyze bill images via OpenAI Vision API.
Called from Node.js backend via child_process.
"""
import sys
import json
import asyncio
import base64
import os
import tempfile

from dotenv import load_dotenv
load_dotenv('.env.node')

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent


async def analyze_bill(image_base64: str, expected_brand: str, expected_price: str) -> dict:
    """Analyze a bill image using OpenAI Vision via emergentintegrations."""
    api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    
    if not api_key:
        return {
            "success": False,
            "brandMatch": True,
            "priceMatch": True,
            "extractedBrand": expected_brand,
            "extractedPrice": float(expected_price),
            "confidence": 30,
            "notes": "API key not configured. Manual review needed."
        }

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"bill-ocr-{os.urandom(4).hex()}",
            system_message="You are an expert bill verification assistant for a phone marketplace. When given a bill/receipt image, extract text and verify brand name and price. Always respond with ONLY valid JSON (no markdown, no code blocks) containing: brandMatch (boolean), priceMatch (boolean), extractedBrand (string), extractedPrice (number), confidence (0-100), notes (string with brief explanation)."
        ).with_model("openai", "gpt-4o")

        image_content = ImageContent(image_base64=image_base64)

        user_message = UserMessage(
            text=f"Verify this bill image. Expected brand: {expected_brand}, Expected price: {expected_price} INR. Extract all visible text and check if brand and price match. Return ONLY JSON.",
            file_contents=[image_content]
        )

        response = await chat.send_message(user_message)
        
        # Try to parse JSON from response
        response_text = response.strip()
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1] if "\n" in response_text else response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
        
        try:
            parsed = json.loads(response_text)
            return {
                "success": True,
                "brandMatch": parsed.get("brandMatch", False),
                "priceMatch": parsed.get("priceMatch", False),
                "extractedBrand": parsed.get("extractedBrand", ""),
                "extractedPrice": parsed.get("extractedPrice", 0),
                "confidence": parsed.get("confidence", 50),
                "notes": parsed.get("notes", response_text)
            }
        except json.JSONDecodeError:
            brand_lower = expected_brand.lower()
            return {
                "success": True,
                "brandMatch": brand_lower in response_text.lower(),
                "priceMatch": expected_price in response_text,
                "extractedBrand": "",
                "extractedPrice": 0,
                "confidence": 50,
                "notes": response_text[:500]
            }

    except Exception as e:
        return {
            "success": False,
            "brandMatch": True,
            "priceMatch": True,
            "extractedBrand": expected_brand,
            "extractedPrice": float(expected_price),
            "confidence": 30,
            "notes": f"AI verification error: {str(e)}. Manual review needed."
        }


def main():
    """Read JSON from stdin, process OCR, write JSON to stdout."""
    try:
        input_data = json.loads(sys.stdin.read())
        image_base64 = input_data.get("image_base64", "")
        expected_brand = input_data.get("brand", "")
        expected_price = str(input_data.get("price", "0"))
        
        result = asyncio.run(analyze_bill(image_base64, expected_brand, expected_price))
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "brandMatch": True,
            "priceMatch": True,
            "extractedBrand": "",
            "extractedPrice": 0,
            "confidence": 0,
            "notes": f"OCR helper error: {str(e)}"
        }))


if __name__ == "__main__":
    main()
