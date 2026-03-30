class MockLLMAdapter:

    def generate_query(self, prompt: str) -> str:
        prompt = prompt.lower()

        if "最大" in prompt or "最多" in prompt:
            return "max"
        if "平均" in prompt:
            return "mean"
        if "趨勢" in prompt:
            return "trend"
        if "總和" in prompt:
            return "sum"

        return "describe"