# BarberApp AI Roadmap

## AI Vision

BarberApp's AI system will have two main parts:

1. Vision Analyzer
2. Chatbot + RAG Recommendation System

The AI system should help clients understand haircut options, receive style/product recommendations, and turn hairstyle ideas into barber-friendly booking notes.

The AI system should also eventually help barbers summarize client history, write profile/service descriptions, and manage client notes.

## Full AI Flow

```txt
User uploads photos
-> Vision analyzer processes images
-> AI creates structured hair/face profile
-> User reviews and edits/corrects profile
-> Confirmed profile is saved to Firestore
-> Chatbot uses confirmed profile + RAG knowledge base
-> Client receives haircut/product/style recommendations
```

## Vision Analyzer

The analyzer should process multiple photo angles:

- front face photo
- left side photo
- right side photo
- back photo

Front photo helps analyze:

- face shape
- hairline
- front/top length
- facial hair
- hair texture

Side photos help analyze:

- side length
- taper/fade area
- ear coverage
- sideburns
- side bulk

Back photo helps analyze:

- back length
- neckline
- crown area
- back bulk
- fade/taper from the back

## Structured Hair Profile

The vision analyzer should output structured JSON.

Example fields:

- `hair.overallLengthCategory`
- `hair.frontLengthInches`
- `hair.sideLengthInches`
- `hair.backLengthInches`
- `hair.texture`
- `hair.density`
- `hair.currentStyle`
- `face.shape`
- `face.facialHair`
- `cutDetails.hasFadeOrTaper`
- `cutDetails.fadeType`
- `cutDetails.neckline`
- `cutDetails.earCoverage`
- confidence scores
- source photo coverage

## Editable AI Results

The user should be able to correct AI output.

Save both:

- original AI prediction
- user-confirmed correction

This improves:

- user trust
- recommendation quality
- future training data
- model evaluation

## Chatbot + RAG

The chatbot should use:

- confirmed hair profile from Firestore
- user question
- retrieved knowledge from vector database
- open-source LLM response generation

RAG knowledge should include:

- haircut style descriptions
- product descriptions
- product reviews
- hair-care guides
- barber instructions
- app help docs
- later, client/barber notes where appropriate

## Vector Database

Recommended options:

- Qdrant for AI-focused open-source setup
- Postgres + pgvector for simpler production setup

Current recommendation:

- Qdrant for portfolio and learning value

## AI Model Direction

Vision:

- start with mock analyzer
- then open-source vision-language model
- later custom/fine-tuned classifiers for hair length, texture, density, face shape, fade/taper detection

Chatbot:

- open-source LLM
- compare Qwen, Llama, Mistral, Gemma, Phi
- use RAG for knowledge
- use fine-tuning for behavior/format, not memorized product facts

## Suggested AI Stack

- FastAPI
- Python
- PyTorch
- Hugging Face Transformers
- SentenceTransformers
- Qdrant
- Open-source LLM server
- Ollama for local testing
- vLLM for deployment later
- RunPod/Vast/local GPU hosting options

## Recommended AI Folder

```txt
ai/
  app/
    main.py
    routes/
    services/
    schemas/
    models/
  data/
    rag_docs/
  notebooks/
  requirements.txt
  README.md
```

## AI Development Phases

- [ ] AI backend skeleton
- [ ] Mock vision analyzer endpoint
- [ ] Editable hair profile screen
- [ ] Small curated RAG knowledge base
- [ ] Chatbot connected to confirmed profile
- [ ] Real vision model
- [ ] Fine-tuning experiments

## AI Safety Boundaries

Avoid:

- harsh appearance judgments
- absolute claims about attractiveness
- medical claims
- identity/race/ethnicity guesses
- saying face shape with total certainty

Prefer:

- Based on the image, this style may fit your current hair length and face proportions.
- Here are options to discuss with your barber.

## AI Future Features

- text-only haircut recommendation chatbot
- image-based haircut/style recommendation
- AI-generated barber service descriptions
- AI-generated booking notes
- AI summaries of past client messages
- AI-powered barber-private notes
- premium AI usage tiers
