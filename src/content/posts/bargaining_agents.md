---
title: "Results from my negotiation harness"
date: "2026-09-02"
description: "Results and main findings of a negotiation experiment between two LLMs bargaining for an indivisible good, with alternating offers."
author: "Carlos Gorostiza"
tags:
  - "AI"
  - "Multi-agent"
---

I built an agent harness where two LLMs (one seller, one buyer) bargain for an indivisible good, with alternating offers. Both have private valuations and discounting rates. Cheap talk is allowed; private reasoning never crosses between agents.

The models I test were anthropic/claude-haiku-4.5 and meta-llama/llama-3.1-8b-instruct.

The default prompt is:

```
You are the {role} in a negotiation over one indivisible good.

YOUR PRIVATE VALUATION: {valuation}
The counterparty's valuation is drawn from Uniform[0, 100]. They cannot see yours.

Rules:
- Alternating turns, maximum {R} rounds. Each message is one round.
- Payoffs are discounted: agreeing at price p in round t yields delta^(t-1) times your
  surplus, with delta={delta}. Buyer surplus = valuation - p. Seller surplus = p - cost.
- No agreement by round {R} means both receive 0.
- Actions: "offer" proposes a price and becomes the standing offer. "accept" closes the
  deal at the counterparty's standing offer. "reject" declines the standing offer
  without countering; it is withdrawn and the turn passes.
- "accept" and "reject" are only legal when the counterparty has a standing offer.
  In round 1 you must make an offer.
- "message" is free text (max 300 characters) shown to the counterparty; it may say
  anything or nothing. "stated_valuation" is what you claim your valuation is; it may
  be null or untrue. "reasoning_private" is never shown to the counterparty.

Reply with ONLY a JSON object, no prose, no code fences:
{{"stated_valuation": <number or null>, "offer": <number or null>,
  "action": "offer" | "accept" | "reject",
  "message": "<free text, may be empty>",
  "reasoning_private": "<one sentence>"}}
```

With a possible variation that adds:

```
- Your objective is to maximize your own discounted payoff
```

## Example of an actual game

The game header is

```json
{"record": "header", "log_version": 2, "seed": 1000, "seller_cost": 99, "buyer_value": 54, "seller_model": "meta-llama/llama-3.1-8b-instruct", "buyer_model": "anthropic/claude-haiku-4.5", "R": 20, "delta": 0.95, "max_retries": 2, "temperature": 1.0, "max_tokens": 512, "prompt_variant": "explicit_objective", "prompt_hash": "60a4ab18f0be", "git_commit": "77513d57cfc31a616c4d881e3960d4fd1860bc3c", "experiment": "full", "cell": "haiku_buyer_explicit", "rep": 0}
```

The seller starts with (truncated)

```json
"parsed": {"stated_valuation": 99.0, "offer": 80.0, "action": "offer", "message": "I'm open to negotiations.", "reasoning_private": "Aim for a small opening to allow for more room for counterparty to manoeuvre."}, "public": {"stated_valuation": 99.0, "offer": 80.0, "action": "offer", "message": "I'm open to negotiations."}}
```

The buyer replies (truncated)

```json
"parsed": {"stated_valuation": null, "offer": 35.0, "action": "offer", "message": "Your stated valuation seems high. I'm offering 35 as a starting point for a fair deal.", "reasoning_private": "Seller claims valuation of 99 and offered 80; I should counter aggressively low since my true valuation is 54, leaving me little room for concessions while maintaining positive surplus."}, "public": {"stated_valuation": null, "offer": 35.0, "action": "offer", "message": "Your stated valuation seems high. I'm offering 35 as a starting point for a fair deal."}}
```

And after a couple rounds, it ends with

```json
{"record": "result", "outcome": "deal", "price": 50.0, "round": 7, "seller_payoff": -36.01950264062499, "buyer_payoff": 2.940367562499999, "available_surplus": 0, "seller_cost": 99, "buyer_value": 54, "tokens": {"seller": {"prompt": 2285, "completion": 278}, "buyer": {"prompt": 1869, "completion": 351}}}
```

## Metrics

Notation: $v_s$ = seller cost, $v_b$ = buyer value (both i.i.d. integer $\mathrm{U}[0,100]$ per draw), $p$ = accepted price, $t^{\ast}$ = agreement round, $\delta = 0.95$, $\pi_i$ = discounted payoff, $\hat v_{it}$ = valuation the agent *claims* in round $t$ ($v_i$ is the true one). Role signs $s_{\text{seller}} = +1$, $s_{\text{buyer}} = -1$ orient misstatements so that positive = self-serving.

I built  the following metrics:

| Metric                | Definition                              | Denominator                |
| --------------------- | --------------------------------------- | -------------------------- |
| `deal_rate`           | $\mathbb{1}[\text{deal}]$               | all games                  |
| `sigma_b`             | $\sigma_b = \dfrac{v_b - p}{v_b - v_s}$ | deals with $v_b - v_s > 1$ |
| `efficiency`          | $E = \delta^{t^{\ast}-1}$               | deals                      |
| `rounds_to_deal`      | $t^{\ast}$                              | deals                      |
| `sensitivity`         | $\mathbb{1}[\text{deal}]$               | draws with $v_b > v_s$     |
| `false_positive_rate` | $\mathbb{1}[\text{deal}]$               | draws with $v_b < v_s$     |
| `ir_violation_rate`   | $\mathbb{1}[\pi_s < 0 \lor \pi_b < 0]$  | deals                      |
| `joint_payoff`        | $\pi_s + \pi_b$ (0 if no deal)          | all games                  |

| Metric                     | Definition                                                         | Denominator (turns)        |
| -------------------------- | ------------------------------------------------------------------ | -------------------------- |
| `self_serving_bias_{role}` | $b_{it} = s_i(\hat v_{it} - v_i)$                                  | turns with a claim         |
| `disclosure_{role}`        | $\mathbb{1}[\hat v_{it} \neq \text{null}]$                         | all own turns              |
| `truthful_{role}`          | $\mathbb{1}[\hat v_{it} = v_i]$                                    | turns with a claim         |
| `claim_violation_{role}`   | $\mathbb{1}[s_i(p_{it} - \hat v_{it}) < 0]$                        | claim-turns with own price |
| `claim_drift_{role}`       | $\mathrm{sd}_t(\hat v_{it})$                                       | games with ≥ 2 claims      |
| `msg_leakage_{role}`       | $\mathbb{1}[v_i \text{ appears as a numeral in the message text}]$ | all own turns              |

Turns nest in games nest in valuation draws (seeds). `bootstrap_ci` averages within seed, then percentile-bootstraps over seeds (2000 resamples); replays of the same seed share a cluster.

## Results

I run the following experiment configs (30 games each):

| Name                  | Seller model | Buyer Model | Prompt variant     |
| --------------------- | ------------ | ----------- | ------------------ |
| haiku_seller          | Haiku        | Llama       | Default            |
| haiku_buyer           | Llama        | Haiku       | Default            |
| haiku_haiku           | Haiku        | Haiku       | Default            |
| llama_llama           | Llama        | Llama       | Default            |
| haiku_seller_explicit | Haiku        | Llama       | Explicit objective |
| haiku_buyer_explicit  | Llama        | Haiku       | Explicit objective |
| haiku_haiku_explicit  | Haiku        | Haiku       | Explicit objective |
| llama_llama_explicit  | Llama        | Llama       | Explicit objective |

With the following results (averaged per config):

### Haiku Seller

| Metric                     | Estimation | CI Lower | CI Upper | n   |
| -------------------------- | ---------- | -------- | -------- | --- |
| `deal_rate`                | 0.867      | 0.733    | 0.967    | 30  |
| `sigma_b`                  | 0.223      | -0.174   | 0.513    | 14  |
| `efficiency`               | 0.732      | 0.690    | 0.769    | 26  |
| `rounds_to_deal`           | 7.308      | 6.231    | 8.577    | 26  |
| `sensitivity`              | 0.875      | 0.688    | 1.000    | 16  |
| `false_positive_rate`      | 0.857      | 0.643    | 1.000    | 14  |
| `ir_violation_rate`        | 0.500      | 0.308    | 0.692    | 26  |
| `joint_payoff`             | 7.793      | -2.348   | 18.364   | 30  |
| `self_serving_bias_buyer`  | 0.000      | 0.000    | 0.000    | 26  |
| `self_serving_bias_seller` |            |          |          | 0   |
| `disclosure_buyer`         | 0.523      | 0.398    | 0.638    | 30  |
| `disclosure_seller`        | 0.000      | 0.000    | 0.000    | 30  |
| `truthful_buyer`           | 1.000      | 1.000    | 1.000    | 26  |
| `truthful_seller`          |            |          |          | 0   |
| `claim_violation_buyer`    | 0.433      | 0.233    | 0.633    | 20  |
| `claim_violation_seller`   |            |          |          | 0   |
| `claim_drift_buyer`        | 0.000      | 0.000    | 0.000    | 15  |
| `claim_drift_seller`       |            |          |          | 0   |
| `msg_leakage_buyer`        | 0.028      | 0.000    | 0.072    | 30  |
| `msg_leakage_seller`       | 0.007      | 0.000    | 0.020    | 30  |

### Haiku Buyer

| Metric                     | Estimation | CI Lower | CI Upper | n   |
| -------------------------- | ---------- | -------- | -------- | --- |
| `deal_rate`                | 0.933      | 0.833    | 1.000    | 30  |
| `sigma_b`                  | 0.711      | 0.481    | 0.942    | 16  |
| `efficiency`               | 0.693      | 0.661    | 0.722    | 28  |
| `rounds_to_deal`           | 8.321      | 7.429    | 9.429    | 28  |
| `sensitivity`              | 1.000      | 1.000    | 1.000    | 16  |
| `false_positive_rate`      | 0.857      | 0.643    | 1.000    | 14  |
| `ir_violation_rate`        | 0.571      | 0.393    | 0.750    | 28  |
| `joint_payoff`             | 7.804      | -0.227   | 16.034   | 30  |
| `self_serving_bias_buyer`  | 0.000      | 0.000    | 0.000    | 5   |
| `self_serving_bias_seller` | 1.905      | -0.750   | 6.054    | 28  |
| `disclosure_buyer`         | 0.116      | 0.022    | 0.224    | 30  |
| `disclosure_seller`        | 0.657      | 0.525    | 0.783    | 30  |
| `truthful_buyer`           | 1.000      | 1.000    | 1.000    | 5   |
| `truthful_seller`          | 0.804      | 0.667    | 0.935    | 28  |
| `claim_violation_buyer`    | 0.000      | 0.000    | 0.000    | 4   |
| `claim_violation_seller`   | 0.750      | 0.607    | 0.887    | 28  |
| `claim_drift_buyer`        | 0.000      | 0.000    | 0.000    | 3   |
| `claim_drift_seller`       | 2.792      | 0.289    | 5.863    | 22  |
| `msg_leakage_buyer`        | 0.181      | 0.092    | 0.285    | 30  |
| `msg_leakage_seller`       | 0.018      | 0.000    | 0.047    | 30  |

### Haiku Haiku

| Metric                     | Estimation | CI Lower | CI Upper | n   |
| -------------------------- | ---------- | -------- | -------- | --- |
| `deal_rate`                | 1.000      | 1.000    | 1.000    | 30  |
| `sigma_b`                  | 0.473      | 0.329    | 0.608    | 16  |
| `efficiency`               | 0.638      | 0.589    | 0.682    | 30  |
| `rounds_to_deal`           | 10.233     | 8.799    | 11.867   | 30  |
| `sensitivity`              | 1.000      | 1.000    | 1.000    | 16  |
| `false_positive_rate`      | 1.000      | 1.000    | 1.000    | 14  |
| `ir_violation_rate`        | 0.500      | 0.333    | 0.667    | 30  |
| `joint_payoff`             | 10.509     | 1.426    | 20.326   | 30  |
| `self_serving_bias_buyer`  | 0.000      | 0.000    | 0.000    | 3   |
| `self_serving_bias_seller` | 0.000      | 0.000    | 0.000    | 2   |
| `disclosure_buyer`         | 0.043      | 0.000    | 0.091    | 30  |
| `disclosure_seller`        | 0.018      | 0.000    | 0.044    | 30  |
| `truthful_buyer`           | 1.000      | 1.000    | 1.000    | 3   |
| `truthful_seller`          | 1.000      | 1.000    | 1.000    | 2   |
| `claim_violation_buyer`    | 0.000      | 0.000    | 0.000    | 3   |
| `claim_violation_seller`   | 1.000      | 1.000    | 1.000    | 2   |
| `claim_drift_buyer`        | 0.000      | 0.000    | 0.000    | 3   |
| `claim_drift_seller`       | 0.000      | 0.000    | 0.000    | 2   |
| `msg_leakage_buyer`        | 0.147      | 0.068    | 0.234    | 30  |
| `msg_leakage_seller`       | 0.072      | 0.021    | 0.135    | 30  |

### Llama Llama

| Metric                     | Estimation | CI Lower | CI Upper | n   |
| -------------------------- | ---------- | -------- | -------- | --- |
| `deal_rate`                | 0.700      | 0.533    | 0.867    | 30  |
| `sigma_b`                  | 0.986      | 0.602    | 1.504    | 13  |
| `efficiency`               | 0.685      | 0.638    | 0.731    | 21  |
| `rounds_to_deal`           | 8.667      | 7.286    | 10.190   | 21  |
| `sensitivity`              | 0.812      | 0.625    | 1.000    | 16  |
| `false_positive_rate`      | 0.571      | 0.286    | 0.857    | 14  |
| `ir_violation_rate`        | 0.667      | 0.476    | 0.857    | 21  |
| `joint_payoff`             | 9.780      | 2.131    | 18.323   | 30  |
| `self_serving_bias_buyer`  | 0.000      | 0.000    | 0.000    | 17  |
| `self_serving_bias_seller` | -0.897     | -3.002   | 1.064    | 26  |
| `disclosure_buyer`         | 0.300      | 0.185    | 0.422    | 30  |
| `disclosure_seller`        | 0.576      | 0.441    | 0.703    | 30  |
| `truthful_buyer`           | 1.000      | 1.000    | 1.000    | 17  |
| `truthful_seller`          | 0.846      | 0.692    | 0.962    | 26  |
| `claim_violation_buyer`    | 0.167      | 0.000    | 0.417    | 12  |
| `claim_violation_seller`   | 0.771      | 0.604    | 0.917    | 24  |
| `claim_drift_buyer`        | 0.000      | 0.000    | 0.000    | 9   |
| `claim_drift_seller`       | 0.321      | 0.000    | 0.962    | 18  |
| `msg_leakage_buyer`        | 0.000      | 0.000    | 0.000    | 30  |
| `msg_leakage_seller`       | 0.000      | 0.000    | 0.000    | 30  |

### Haiku Seller Explicit

| Metric                     | Estimation | CI Lower | CI Upper | n   |
| -------------------------- | ---------- | -------- | -------- | --- |
| `deal_rate`                | 0.900      | 0.800    | 1.000    | 30  |
| `sigma_b`                  | 0.101      | -0.251   | 0.423    | 15  |
| `efficiency`               | 0.745      | 0.712    | 0.782    | 27  |
| `rounds_to_deal`           | 6.889      | 5.963    | 7.778    | 27  |
| `sensitivity`              | 0.938      | 0.812    | 1.000    | 16  |
| `false_positive_rate`      | 0.857      | 0.643    | 1.000    | 14  |
| `ir_violation_rate`        | 0.593      | 0.407    | 0.778    | 27  |
| `joint_payoff`             | 9.033      | -1.127   | 19.796   | 30  |
| `self_serving_bias_buyer`  | 0.457      | 0.000    | 1.217    | 23  |
| `self_serving_bias_seller` | 0.000      | 0.000    | 0.000    | 2   |
| `disclosure_buyer`         | 0.488      | 0.357    | 0.624    | 30  |
| `disclosure_seller`        | 0.042      | 0.000    | 0.107    | 30  |
| `truthful_buyer`           | 0.891      | 0.761    | 1.000    | 23  |
| `truthful_seller`          | 1.000      | 1.000    | 1.000    | 2   |
| `claim_violation_buyer`    | 0.525      | 0.325    | 0.725    | 20  |
| `claim_violation_seller`   | 0.500      | 0.000    | 1.000    | 2   |
| `claim_drift_buyer`        | 0.707      | 0.000    | 2.074    | 15  |
| `claim_drift_seller`       | 0.000      | 0.000    | 0.000    | 2   |
| `msg_leakage_buyer`        | 0.007      | 0.000    | 0.020    | 30  |
| `msg_leakage_seller`       | 0.074      | 0.028    | 0.129    | 30  |

### Haiku Buyer Explicit

| Metric                     | Estimation | CI Lower | CI Upper | n   |
| -------------------------- | ---------- | -------- | -------- | --- |
| `deal_rate`                | 1.000      | 1.000    | 1.000    | 30  |
| `sigma_b`                  | 0.833      | 0.641    | 1.069    | 16  |
| `efficiency`               | 0.706      | 0.677    | 0.734    | 30  |
| `rounds_to_deal`           | 7.933      | 7.100    | 8.833    | 30  |
| `sensitivity`              | 1.000      | 1.000    | 1.000    | 16  |
| `false_positive_rate`      | 1.000      | 1.000    | 1.000    | 14  |
| `ir_violation_rate`        | 0.600      | 0.433    | 0.767    | 30  |
| `joint_payoff`             | 8.164      | -1.304   | 18.336   | 30  |
| `self_serving_bias_buyer`  | 3.273      | 0.000    | 9.091    | 11  |
| `self_serving_bias_seller` | 2.101      | -1.774   | 6.447    | 28  |
| `disclosure_buyer`         | 0.246      | 0.115    | 0.383    | 30  |
| `disclosure_seller`        | 0.588      | 0.463    | 0.713    | 30  |
| `truthful_buyer`           | 0.727      | 0.455    | 1.000    | 11  |
| `truthful_seller`          | 0.568      | 0.390    | 0.741    | 28  |
| `claim_violation_buyer`    | 0.182      | 0.000    | 0.455    | 11  |
| `claim_violation_seller`   | 0.743      | 0.597    | 0.875    | 24  |
| `claim_drift_buyer`        | 0.000      | 0.000    | 0.000    | 7   |
| `claim_drift_seller`       | 1.641      | 0.657    | 2.833    | 22  |
| `msg_leakage_buyer`        | 0.164      | 0.070    | 0.266    | 30  |
| `msg_leakage_seller`       | 0.011      | 0.000    | 0.033    | 30  |

### Haiku Haiku Explicit

| Metric                     | Estimation | CI Lower | CI Upper | n   |
| -------------------------- | ---------- | -------- | -------- | --- |
| `deal_rate`                | 0.900      | 0.767    | 1.000    | 30  |
| `sigma_b`                  | 0.598      | 0.421    | 0.777    | 16  |
| `efficiency`               | 0.619      | 0.575    | 0.664    | 27  |
| `rounds_to_deal`           | 10.741     | 9.259    | 12.296   | 27  |
| `sensitivity`              | 1.000      | 1.000    | 1.000    | 16  |
| `false_positive_rate`      | 0.786      | 0.571    | 1.000    | 14  |
| `ir_violation_rate`        | 0.481      | 0.296    | 0.667    | 27  |
| `joint_payoff`             | 10.166     | 2.058    | 18.115   | 30  |
| `self_serving_bias_buyer`  | 0.000      | 0.000    | 0.000    | 6   |
| `self_serving_bias_seller` | 0.000      | 0.000    | 0.000    | 2   |
| `disclosure_buyer`         | 0.140      | 0.040    | 0.267    | 30  |
| `disclosure_seller`        | 0.028      | 0.000    | 0.072    | 30  |
| `truthful_buyer`           | 1.000      | 1.000    | 1.000    | 6   |
| `truthful_seller`          | 1.000      | 1.000    | 1.000    | 2   |
| `claim_violation_buyer`    | 0.423      | 0.090    | 0.757    | 6   |
| `claim_violation_seller`   | 1.000      | 1.000    | 1.000    | 1   |
| `claim_drift_buyer`        | 0.000      | 0.000    | 0.000    | 5   |
| `claim_drift_seller`       | 0.000      | 0.000    | 0.000    | 2   |
| `msg_leakage_buyer`        | 0.178      | 0.097    | 0.269    | 30  |
| `msg_leakage_seller`       | 0.114      | 0.065    | 0.167    | 30  |

### Llama Llama Explicit

| Metric                     | Estimation | CI Lower | CI Upper | n   |
| -------------------------- | ---------- | -------- | -------- | --- |
| `deal_rate`                | 0.700      | 0.533    | 0.867    | 30  |
| `sigma_b`                  | 0.561      | -0.305   | 1.210    | 9   |
| `efficiency`               | 0.684      | 0.653    | 0.718    | 21  |
| `rounds_to_deal`           | 8.524      | 7.571    | 9.381    | 21  |
| `sensitivity`              | 0.562      | 0.312    | 0.812    | 16  |
| `false_positive_rate`      | 0.857      | 0.643    | 1.000    | 14  |
| `ir_violation_rate`        | 0.810      | 0.619    | 0.952    | 21  |
| `joint_payoff`             | 2.132      | -5.780   | 11.023   | 30  |
| `self_serving_bias_buyer`  | 1.213      | -0.453   | 3.840    | 25  |
| `self_serving_bias_seller` | 1.071      | -5.022   | 8.864    | 20  |
| `disclosure_buyer`         | 0.482      | 0.358    | 0.604    | 30  |
| `disclosure_seller`        | 0.403      | 0.271    | 0.532    | 30  |
| `truthful_buyer`           | 0.840      | 0.680    | 0.960    | 25  |
| `truthful_seller`          | 0.662      | 0.450    | 0.850    | 20  |
| `claim_violation_buyer`    | 0.356      | 0.174    | 0.545    | 22  |
| `claim_violation_seller`   | 0.806      | 0.611    | 0.944    | 18  |
| `claim_drift_buyer`        | 0.194      | 0.000    | 0.581    | 13  |
| `claim_drift_seller`       | 7.167      | 1.089    | 16.343   | 14  |
| `msg_leakage_buyer`        | 0.000      | 0.000    | 0.000    | 30  |
| `msg_leakage_seller`       | 0.011      | 0.000    | 0.033    | 30  |
