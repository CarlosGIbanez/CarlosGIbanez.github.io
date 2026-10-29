---
title: "Gauss-Markov Assumptions"
date: "2026-10-28"
description: "Brief summary of the Gauss-Markov assumptions, what each buys, what if each breaks and how to fix it."
author: "Carlos Gorostiza"
tags:
  - "Econometrics"
  - "Machine Learning"
---

The Gauss-Markov assumptions are the conditions under which OLS is the best linear unbiased estimator (BLUE). If the population model is causal, assumption 4 is what lets you read the coefficients causally. If the fifth fails, the usual standard errors are wrong and OLS is no longer the most efficient linear unbiased estimator; if the fourth fails, you can't even do causal inference from a _ceteris paribus_ (everything else constant) assumption; if the first fails, there is no well-defined target; if the second fails, your standard errors (and sometimes your estimates) can’t be trusted; if the third fails, you can’t even compute OLS.

## 1. Linear in parameters

The population model can be written as
$$  \mathbf{y} = \mathbf{X} \boldsymbol{\beta} + \mathbf{u}  $$
in matrix notation. Or
$$ y_i = \beta_0 + \beta_1 x_{i1} + \beta_2 x_{i2} + ... + \beta_k x_{ik} + u_i, \ \ \ \forall i $$
That is, the model must be linear in the $\beta$'s (not necessarily in the variables).

Examples:

- $y_i = \beta_0 + \beta_1 x_1 + \beta_2 x_1^2$→ Is linear in parameters
- $\log y_i = \beta_0 + \beta_1 x_1 + \beta_2 \log x_2$ → Is linear in parameters
- $y_i = x_1^{\beta_1} + u_i$ → ISN'T linear in parameters

**What this assumption buys**: a well-defined population target $\beta$ that OLS is trying to estimate
**What happens if this assumption breaks**: If $\beta$ enters nonlinearity, we can't use OLS.

> Some non linear models can be transformed into linear ones. For example: $y_i​=Ax_i^\beta​e^{u_i}​$ → $\log y_i = \log A + \beta \log x_i + u_i$. Whether it can be linearized depends on how the error enters.
>
## 2. Random sampling

The observations $\{ (x_i, y_i) \}_{i=1}^n$ are _i.i.d._ (_independent and identically distributed_) draws from the population. That is, every observation you have has nothing to do with any other, and each observation $(x_i, y_i)$ is drawn from the same joint distribution.

This is an easy assumption to break in social sciences.

**What buys**: the errors $u_i$ are independent across observations
**What if breaks**:

- **Clustering**: The observations aren't independent (e.g. all the students from the same school share some part of the error), serial correlation in time series. The estimates are often still fine, but the _standard errors usually become too small_ in comparison with the real ones
- **Sample selection**: e.g., wages are observed only for people who choose to work. If that choice depends on unobservables that also affect wages (e.g., motivation), $\hat\beta$ is biased.

**How to fix**: Use cluster-robust standard errors

## 3. No perfect collinearity

In the sample, there are no exact linear relationships among the independent variables. No column of $X$ is an exact linear combination of the others. No variable can be expressed as an exact linear combination of the others.

This also means we require at least as many observations as parameters, $n \ge k+1$.

**What it buys**: $X'X$ is invertible, so the OLS estimator $\hat{\beta} = (X'X)^{-1}X'\mathbf{y}$ exists and is unique.
**What if breaks**: if $X'X$ is [singular](https://en.wikipedia.org/wiki/Singular_matrix), there are infinitely many solutions and the software you are using commonly drops a variable.

> _High but imperfect_ correlation between regressors is allowed. It doesn’t break unbiasedness, but it inflates the variance.

---

These first three assumptions are the  “can I even run this regression, and is there a target?” checks. Assumption 4 is about bias and causal interpretation; assumption 5 is about efficiency and valid inference.

## 4. Zero conditional mean

$$ E[u|X] = 0 $$

In scalar form, combined with random sampling: $E[u_i|x_{i1}, ..., x_{ik}]=0$. Knowing someone's regressors tells you nothing about the average of their unobservables.

- $E[u]=0$ alone is a harmless normalization, since the intercept absorbs any nonzero mean. The real content is "given $X$" part

**What it buys**

- Unbiasedness: $E[{\hat{\beta}_\text{OLS}}] = \beta$, the expected value of our estimates is the real value of the coefficients
- _The ceteris paribus interpretation_:  $\beta_j$ is the effect of $x_j$ holding the others fixed.

**What if breaks** (endogeneity):

- _Omitted Variable Bias_: e.g., ability is in $u$ and correlates with education in your regression $y_i = \beta_0 + \beta_1 \text{education}_i + u_i$
- _Measurement error_ in a regressor. If you observe $x_i = x_i^* + e_i$ instead of the true $x_i^*$, then $e_i$ ends up in the composite error, which is now correlated with $x_i$.
- _Simultaneity_: $y$ also affects $x$, as with price and quantity
- _Wrong functional form_: e.g, the true effect is quadratic but you fit a line

> _Intuitively_: If the unobservables move systematically with $X$, OLS can’t tell them apart from the effect of $X$. It attributes part of their effect to $X$, so $\hat\beta$ absorbs it.

We can see it with the sampling error, substituting $y = X \beta + u$ in the estimator $\hat{\beta}_\text{OLS}$ we have:
$$ E[\hat{\beta}_\text{OLS}|X] = \underbrace{\beta}_\text{Truth} + \underbrace{(X^T X)^{-1}X^T E[u|X]}_\text{bias} $$
The sampling error depends on the value of $E[u| X]$, if the error averages out to zero ($E[u|X]=0$), then the $\hat{\beta}_\text{OLS}$ is unbiased.

**How to solve it**. You need to develop good econometrician judgment, and apply: Instrumental Variables, Generalized Method of Moments, Control Function, Fixed Effects, Difference-in-Differences, Heckman Selection Correction for sample selection, etc., each of which trades assumption 4 for a different, hopefully more credible, assumption.

## 5. Homoskedasticity

$$ Var(u|X) = \sigma^2 I_n $$
where $I_n$ is an $n \times n$ identity matrix. In full
$$ Var(u|X) = \begin{bmatrix} \sigma^2 & 0 & 0 & \cdots & 0 \\ 0 & \sigma^2 & 0 & \cdots & 0 \\ \vdots & \vdots & & \ddots & \vdots \\ 0 & 0 & \cdots & & \sigma^2 \end{bmatrix} $$
A matrix with the diagonal of $\sigma^2$ and 0's everywhere else.

- **Diagonal, same $\sigma^2$ everywhere**: the error variance doesn't depend on $X$. In scalar form, $Var(u_i|x_i) = \sigma^2$.
- **Off-diagonal =0 (no correlation across observations)**: this part is mostly inherited from random sampling.

**What buys**:

- The simple variance formula $Var(\hat{\beta}|X) = \sigma^2 (X^T X)^{-1}$
- Efficiency: $\hat{\beta}_\text{OLS}$ has the _smallest variance_ among all linear unbiased estimators, conditional on $X$.

**What if it breaks** (heteroskedasticity)

- $\hat{\beta}$ is still unbiased
- The usual variance formula is _wrong_, so the usual SEs are wrong, so the usual t-tests, F-tests and confidence intervals are _invalid_
- OLS is no longer the best linear unbiased estimator. Weighted least squares can beat it

**How to solve it**: robust standard errors to fix inference (but not efficiency), weighted least squares, generalized least squares, data transformations.

> **Gauss-Markov theorem:** under assumptions 1–5, OLS is BLUE (the Best Linear Unbiased Estimator).
>
## Extra: Normality

If we assume that the error is distributed Normal with mean 0 and variance $\sigma^2$, then we can use _exact finite sample inference_.

This allows for exact t- and F-distributions in small samples. However, due to the [Central Limit Theorem](https://en.wikipedia.org/wiki/Central_limit_theorem), these tests remain asymptotically valid (approximate) in large samples, if the above assumptions hold.

---

If you have any question or correction, please let me know!
