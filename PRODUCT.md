# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vue browser prototype first; desktop shell and migration target remain undecided.

## Users

People who want an emotionally responsive digital companion, including judges evaluating the project in a competition demo.

## Product Purpose

Build a companion experience with an in-app conversation view and a desktop-pet view that share the same conversation state. It should connect camera-based affect cues, expressive TTS, and a Live2D character so the companion can respond with coordinated voice, face, and motion.

## Positioning

The experience combines conversation, facial-affect input, synthesized speech, and avatar performance in one shared interaction loop.

## Brand Commitments

The interface should feel gentle and comforting while using an original MyGO-inspired "迷途之子" visual direction: a rain-washed blue-hour city, companionship amid uncertainty, and a Galgame dialogue stage. Avoid copying official UI or distributing character assets without permission.

## Operating Context

The first deliverable is a browser-based Vue prototype. The intended next stage is a desktop companion application. The reply LLM is hosted separately by the user and is outside the current front-end and TTS planning scope.

## Capabilities and Constraints

- The first browser prototype uses a Galgame-style story stage as its main view, showing one attributed line at a time; clicking the dialogue box advances to the next pending line.
- A conversation can invite up to two companion characters to participate together; each turn is attributed to its speaker.
- Character stage slots are independent of model assets; local MyGO Live2D models and costume selection are connected for the current demonstration.
- A desktop-pet presentation should reuse the same conversation and companion state.
- The user wants YOLO-related camera perception and TTS integration. The exact face-expression model, inference location, and camera workflow remain undecided.
- IndexTTS 2/2.5 is the intended TTS direction; the service interface and deployment location remain undecided.
- The competition rules have not been provided, so attribution and originality requirements remain open.
- The final avatar, voice, and usage permissions have not been selected.

## Evidence on Hand

- AIRI desktop v0.12.0-beta.5 was downloaded from its official release and launched successfully as a feasibility check; it is not yet selected as the final application shell.
- The current MyGO model collection is used locally for demonstration; permission for competition distribution or public release has not been established. No approved voice assets or competition rule document is currently recorded in the project.

## Product Principles

- Keep chat and desktop-pet modes in one continuous conversation.
- Let multiple companions share one scene while keeping their identities and turns distinct.
- Make voice, facial expression, and avatar behavior respond coherently.
- Treat camera perception as an optional input to companionship.
- Keep the LLM service replaceable and outside the front-end's core responsibilities.
- Make the project's original integration and interaction work visible in the competition demo.
