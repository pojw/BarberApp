from app.services.llmService import create_llm_client
from app.core.config import settings
from app.models.response import FrontHairAnalysis
import json
import re

def analyze_front_image(
    front_image_data_url: str,
) -> FrontHairAnalysis:
    prompt = build_front_analysis_prompt()
    client = create_llm_client()

    completion = client.chat.completions.create(
        model=settings.HF_MODEL,
        extra_body={
    "chat_template_kwargs": {
        "enable_thinking": False,
    },
},
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": front_image_data_url,
                        },
                    },
                ],
            }
        ],
        temperature=0.2,
        max_tokens=600,
    )

    generated_text = (
        completion.choices[0].message.content
    )

    if not completion.choices:
        raise ValueError(
        "VLM returned no completion choices."
    )

    generated_text = completion.choices[0].message.content

    if generated_text is None:
        raise ValueError(
            "VLM returned no message content."
        )

    generated_text = generated_text.strip()

    if not generated_text:
        raise ValueError(
            "VLM returned only whitespace."
        )

    parsed_response = parse_json_response(
    generated_text
)
    front_analysis = FrontHairAnalysis.model_validate(
    parsed_response
)

    print(
        "Validated front analysis:",
        front_analysis
    )
    return front_analysis

  

def build_front_analysis_prompt():
    return """
Analyze only the visible front view of the person's hair and face.

Return only valid JSON matching the required schema.

Allowed values:

forehead_coverage:
- none
- slight
- partial
- mostly_covered
- fully_covered
- unclear

fringe_end_level:
- no_fringe
- upper_forehead
- mid_forehead
- lower_forehead
- eyebrow_level
- below_eyebrows
- unclear

Rules:
- Use only visible evidence from the image.
- Do not guess hidden areas.
- Use "unclear" when the image does not support a confident answer.
- forehead_coverage describes how much of the forehead is covered by hair.
- fringe_end_level describes the lowest point reached by the front hair.
- Use the exact allowed strings above.
- confidence must be between 0.0 and 1.0.
""".strip()

def parse_json_response(generated_text: str) -> dict:
    cleaned_text = generated_text.strip()

    cleaned_text = re.sub(
        r"^```json\s*",
        "",
        cleaned_text,
        flags=re.IGNORECASE,
    )

    cleaned_text = re.sub(
        r"\s*```$",
        "",
        cleaned_text,
    )

    return json.loads(cleaned_text)