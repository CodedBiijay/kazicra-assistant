import base64
import mimetypes
import os
import argparse
import sys
from google import genai
from google.genai import types

def save_binary_file(file_name, data):
    try:
        with open(file_name, "wb") as f:
            f.write(data)
        print(f"File saved to: {file_name}")
    except Exception as e:
        print(f"Error saving file: {e}")

def generate(prompt, output_prefix):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        sys.exit(1)

    print(f"Generating image for prompt: '{prompt}'...")
    
    client = genai.Client(api_key=api_key)
    model = "gemini-3-pro-image-preview"
    
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
            ],
        ),
    ]
    
    # Enable Google Search tool if needed by the model logic, 
    # though for pure image gen it might not be strictly necessary unless requested.
    # Keeping it as per user's original snippet.
    tools = [
        types.Tool(googleSearch=types.GoogleSearch()),
    ]
    
    generate_content_config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
        image_config=types.ImageConfig(image_size="1K"),
        tools=tools,
    )

    file_index = 0
    images_found = 0
    
    try:
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            if (chunk.candidates is None or 
                not chunk.candidates or 
                chunk.candidates[0].content is None or 
                chunk.candidates[0].content.parts is None):
                continue

            for part in chunk.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    # Handle Image Data
                    inline_data = part.inline_data
                    data_buffer = inline_data.data
                    file_extension = mimetypes.guess_extension(inline_data.mime_type) or ".png"
                    
                    if output_prefix.endswith(file_extension):
                        # User provided full filename
                        file_name = output_prefix
                    else:
                        # User provided prefix
                        file_name = f"{output_prefix}_{file_index}{file_extension}"
                    
                    save_binary_file(file_name, data_buffer)
                    file_index += 1
                    images_found += 1
                elif part.text:
                    # Print text output (if any)
                    print(f"Model: {part.text}")
                    
    except Exception as e:
        print(f"Error during generation: {e}")
        sys.exit(1)

    if images_found == 0:
        print("No images were generated.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate images using Gemini 3 Pro.")
    parser.add_argument("--prompt", required=True, help="Text description of the image to generate")
    parser.add_argument("--output", required=True, help="Output filename or prefix (e.g. 'hero_image' or 'hero_image.png')")
    
    args = parser.parse_args()
    generate(args.prompt, args.output)
