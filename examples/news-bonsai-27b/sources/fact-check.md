# Bonsai 2.5 27B · 事实卡

核对日期 2026-11-27。数字使用发布方口径，运行建议是供读者自行验证的检查步骤。

## 发布与容量
PrismML 于 2026-11-24 发布 Ternary Bonsai 2.5 27B，基于 Qwen3.8 27B。官方公告沿用约 5.9 GB 的体积口径。
模型卡将 5.93 GB 对应到 PTQ1_0 权重文件，同表的 Qwen3.8 FP16 为 53.8 GB。上一版 Bonsai 2 27B 也为 5.93 GB。
[发布原文](https://prismml.com/news/bonsai-2-5-27b) · [模型卡](https://huggingface.co/prism-ml/Ternary-Bonsai-2.5-27B-GGUF)

## 同一张表里的成绩
发布方报告的 SWE-bench Verified 得分为 Bonsai 2 的 60.8、Bonsai 2.5 的 75.6、Qwen3.8 27B FP16 的 80.6。
这组分数来自发布方评测。适合用来说明同一评测里的版本差异。选模型仍要复测自己的文件、工具和任务。
[官方评测表](https://prismml.com/news/bonsai-2-5-27b)

## 本机运行的三项检查
先查权重格式和推理引擎。模型卡给 PTQ1_0 / PQ2_0 标的是 PrismML 的 llama.cpp 分支，另列适用于指定版本上游 llama.cpp 的 Q2_0。Apple 用户可看官方列出的 MLX 版本。
再预留权重之外的运行空间。KV 缓存、运行缓冲和其他程序都会占内存，长上下文也可能抬高占用。
最后使用短上下文跑一条真实任务，记录机器、版本、峰值内存和用时。本样稿没有做模型推理测速。
[运行格式与版本](https://huggingface.co/prism-ml/Ternary-Bonsai-2.5-27B-GGUF#which-llamacpp-runs-which-file) · [Hugging Face 缓存说明](https://huggingface.co/docs/transformers/main/kv_cache)
