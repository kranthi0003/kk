## My work at GitHub
tags: job, role, actions, ci, cd, workflows, runners, enterprise, support
ask: What do you actually do at GitHub?
I work on GitHub Actions: CI/CD, workflows, runners, reusable workflows and secrets, for enterprises running it at scale. Supporting Actions taught me every way a workflow can fail; the certification just made me say why, precisely.

## Why a job gets stuck in queued
tags: actions, queued, runner, stuck, pending, waiting
link: https://kranthikiran.com/#/blog/til-actions-job-stuck-queued
A queued job is a job still looking for a runner. When no runner matching its labels is available, it waits. I check the usual causes in a fixed order, and I wrote the order up on my blog.

## Cancelling superseded runs
tags: actions, concurrency, cancel, minutes, ci time, cost
link: https://kranthikiran.com/#/blog/til-actions-concurrency-cancel
Push three times to a PR and you get three runs, two of them already pointless. One concurrency group with cancel-in-progress cancels the stale ones and saves a surprising amount of CI time.

## Locking down GITHUB_TOKEN
tags: actions, token, permissions, least privilege, security, github_token
link: https://kranthikiran.com/#/blog/til-actions-token-permissions
Every run gets an automatic GITHUB_TOKEN, and its default scope depends on a setting you might not control. Declaring permissions in the workflow yourself removes the guesswork: least privilege is one key in the file.

## My time at Couchbase
tags: couchbase, nosql, database, xdcr, rebalance, failover, cluster, support
Running Couchbase in support taught me the failure modes of a distributed database. I worked with big enterprise customers like Netflix, Apple and Salesforce. The admin certification made me formalise what I'd learned in the trenches: buckets, XDCR, rebalances, and keeping a distributed database boringly reliable.

## My time at Amazon
tags: aws, amazon, cloud, hyderabad, first job
About four years as a Cloud Engineer at Amazon in Hyderabad, from 2021 to 2025, on distributed systems at scale serving millions of customers. Living inside AWS every day is what turned a pile of services into a way of designing systems for me.

## How I think about reliability
tags: sre, reliability, error budget, slo, uptime, incidents, failure
link: https://kranthikiran.com/#/blog/error-budgets-in-one-minute
A 100% reliability target is a trap. The goal was never zero failures: an error budget lets a team move fast and stay stable at the same time, because you agree up front how much failure is acceptable and spend it deliberately.

## How I use AI at work
tags: ai, claude, copilot, llm, chatgpt, prompts, tools
ask: How do you use AI in your work?
I use Claude every day: drafting, debugging, rubber-ducking through incidents. Copilot is in my editor, my terminal and my pull requests, and Copilot CLI runs right in my shell. The habit that matters most is checking the output: verify before you trust. The Copilot certification didn't teach me to use Copilot; it made me able to say exactly when not to.

## My stack
tags: skills, languages, tech, tools, python, go, java, kubernetes, terraform, docker, linux
ask: What's your tech stack?
Languages: Python, Java, Ruby, Bash, Go, JavaScript. Cloud and infra: AWS, Azure, Terraform, Docker, Kubernetes, Linux. Data and monitoring: PostgreSQL, Couchbase, Redis, Prometheus, Grafana. Tooling: GitHub Actions, GitOps, CI/CD, Copilot, VS Code. My daily driver is a Mac.
