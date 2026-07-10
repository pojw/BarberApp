import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()


hf_token = os.getenv("HF_TOKEN")
hf_model = os.getenv("HF_MODEL")
hf_base_url = os.getenv("HF_BASE_URL")


if not hf_token:
    raise RuntimeError("HF_TOKEN is missing from the environment.")

if not hf_model:
    raise RuntimeError("HF_MODEL is missing from the environment.")

if not hf_base_url:
    raise RuntimeError("HF_BASE_URL is missing from the environment.")


client = OpenAI(
    base_url=hf_base_url,
    api_key=hf_token,
)


completion = client.chat.completions.create(
    model=hf_model,
    messages=[
        {
            "role": "system",
            "content": (
                "You are BarberApp's Hair Assistant. "
                "Give concise, practical haircut and styling advice."
            ),
        },
        {
            "role": "user",
            "content": "What is a low-maintenance haircut?",
        },
    ],
    temperature=0.7,
    max_tokens=300,
)


print(completion.choices[0].message.content)