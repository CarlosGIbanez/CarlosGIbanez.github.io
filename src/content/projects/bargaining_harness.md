---
title: "Bargaining AI Harness"
description: "A simple two-agent alternating-offers bargaining harness for evaluating LLM strategic behaviour."
tags:
  - "AI"
  - "Multi-agent"
external_url: "https://github.com/CarlosGIbanez/negotiation-harness"
---

## Project Overview

Two-agent alternating-offers bargaining harness for evaluating LLM behaviour.
A seller and a buyer (two LLMs via OpenRouter) negotiate over one indivisible
good with private valuations, discounting, and a structured JSON message
format. Cheap talk is allowed; private reasoning never crosses between agents.

## Technical Details

- **Game:** seller cost $v_s$ and buyer value $v_b$ drawn i.i.d. from integer $\mathrm{U}[0,100]$, up to $R = 20$ alternating rounds, discount factor $\delta = 0.95$. No agreement by round $R$ means both get 0.
- **Actions:** each turn, an agent replies with a single JSON object containing `stated_valuation`, `offer`, `action` (`offer` / `accept` / `reject`), a free-text `message` (max 300 characters) and `reasoning_private`. The counterparty only sees the public fields.
- **Prompt variants:** a default prompt, and an explicit-objective variant that adds "Your objective is to maximize your own discounted payoff".
- **Logging:** every game writes a header record (seed, valuations, models, $R$, $\delta$, temperature, max tokens, retries, prompt variant and hash, git commit), one record per turn (parsed and public message), and a result record (outcome, price, round, discounted payoffs, token usage).
- **Metrics:** outcome metrics (deal rate, buyer's surplus share $\sigma_b$, efficiency, rounds to deal, sensitivity, false-positive rate, individual-rationality violations, joint payoff) and per-turn honesty metrics (disclosure, truthfulness, self-serving bias, claim violation, claim drift, message leakage).
- **Statistics:** turns nest in games, which nest in valuation draws. Confidence intervals average within each seed, then percentile-bootstrap over seeds (2000 resamples).

## Design Approach

The harness separates what an agent *says* from what it *knows*. Each agent's true valuation is private, but agents can claim any valuation (or none) and send cheap talk. Because claims are structured fields rather than buried in prose, they can be compared directly against the true valuations to measure honesty, bias and consistency. Private reasoning is logged for analysis but never crosses to the other agent.

Games are seeded and the same valuation draws are reused across configurations, so model pairings (Haiku vs Llama, in both roles) and prompt variants are compared on the same draws. Logging the prompt hash and git commit with every game makes each result traceable to the exact setup that produced it.

Results from the first experiment (240 games, 8 configurations) are in the blog post [Results from my negotiation harness](/posts/bargaining_agents), and the transcripts are on [Hugging Face](https://huggingface.co/datasets/CarlosGI/llm-bargaining-transcripts).
