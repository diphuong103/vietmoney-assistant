import json
import urllib.request
import urllib.error
import time

def test_query(f, test_id, query, history=None):
    if history is None:
        history = []
    url = "http://localhost:8000/chat/stream"
    data = json.dumps({"query": query, "history": history}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    
    f.write(f"\n## {test_id}\n**Input:** {query}\n\n**Output:**\n")
    try:
        with urllib.request.urlopen(req) as response:
            content = ""
            for line in response:
                decoded = line.decode('utf-8').strip()
                if decoded.startswith('data: '):
                    try:
                        event = json.loads(decoded[6:])
                        if event.get("type") == "token":
                            content += event.get("content", "")
                        elif event.get("type") == "error":
                            content += "\n[ERROR]: " + event.get("content", "")
                    except Exception as e:
                        pass
            f.write(content + "\n")
            return content
    except urllib.error.URLError as e:
        f.write(f"Error connecting: {e}\n")
        return f"Error connecting: {e}"

if __name__ == "__main__":
    with open("test_results.md", "w", encoding="utf-8") as f:
        # Nhóm 1: Ngôn ngữ
        test_query(f, "TC-01", "What are the best places to visit in Vietnam?")
        test_query(f, "TC-02", "Những địa điểm du lịch nổi tiếng ở Việt Nam là gì?")
        
        # TC-03: Chuyển ngôn ngữ giữa chừng
        hist_tc03 = [{"role": "user", "content": "What is pho?"}]
        ans_tc03 = test_query(f, "TC-03-Q1", "What is pho?")
        hist_tc03.append({"role": "assistant", "content": ans_tc03})
        test_query(f, "TC-03-Q2", "쌀국수가 맛있나요?", history=hist_tc03)
        
        test_query(f, "TC-04", "베트남에서 가장 유명한 음식은 무엇인가요?")
        test_query(f, "TC-05", "ベトナムで一番おいしい料理は何ですか？")
        test_query(f, "TC-06", "i want go hoi an what food should eat there?")

        # Nhóm 2: Kiến thức
        test_query(f, "TC-07", "How many VND is 1 USD?")
        test_query(f, "TC-08", "Top places to visit in North Vietnam?")
        test_query(f, "TC-09", "What local food should I try in Hoi An?")
        test_query(f, "TC-10", "Do I need a visa to visit Vietnam as an American?")
        test_query(f, "TC-11", "How do I get from Hanoi to Ha Long Bay?")
        test_query(f, "TC-12", "I am vegetarian. What can I eat in Vietnam?")
        test_query(f, "TC-13", "Is halal food available in Ho Chi Minh City?")
        test_query(f, "TC-14", "I am allergic to peanuts. Is Vietnamese food safe for me?")

        # Nhóm 3: Thời gian thực
        test_query(f, "TC-15", "What is the weather like in Da Nang today?")
        test_query(f, "TC-16", "Will it rain in Hoi An for the next 2 days?")
        test_query(f, "TC-17", "What is the exact USD to VND exchange rate right now?")
        test_query(f, "TC-18", "How much is a flight from Hanoi to Ho Chi Minh City this weekend?")
        
        # Nhóm 4: Edge case
        test_query(f, "TC-19", "Who won the World Cup 2022?")
        test_query(f, "TC-20", "I want to go somewhere nice")
        test_query(f, "TC-21", "Is it better to visit Hanoi, Hoi An or Phu Quoc?")
        test_query(f, "TC-22", "Tell me about Mu Cang Chai")
        
        hist_23 = []
        ans_23_1 = test_query(f, "TC-23-Q1", "What is pho?")
        hist_23.extend([{"role": "user", "content": "What is pho?"}, {"role": "assistant", "content": ans_23_1}])
        ans_23_2 = test_query(f, "TC-23-Q2", "What is pho?", history=hist_23)
        hist_23.extend([{"role": "user", "content": "What is pho?"}, {"role": "assistant", "content": ans_23_2}])
        test_query(f, "TC-23-Q3", "What is pho?", history=hist_23)
        
        test_query(f, "TC-24", "Create a 7-day itinerary for Vietnam under $500 total")

        # Nhóm 5: UX
        test_query(f, "TC-25", "I want to try local food")
        test_query(f, "TC-26", "That answer was not helpful. Give me something better.")
        test_query(f, "TC-27", "Thank you, that was very helpful!")
        test_query(f, "TC-28-A", "Hey! Im planning a trip to vietnam with my friends, any cool spots?")
        test_query(f, "TC-28-B", "I am planning a cultural trip to Vietnam with my spouse for our anniversary.")
        test_query(f, "TC-29", "I am traveling with my wife and two kids (ages 8 and 12), we have 10 days, fly into Hanoi, budget is medium, kids love beaches and history, wife has fish allergy. What do you recommend?")
        
        hist_30 = []
        ans_30_1 = test_query(f, "TC-30-Q1", "My name is John and I am from Germany.")
        hist_30.extend([{"role": "user", "content": "My name is John and I am from Germany."}, {"role": "assistant", "content": ans_30_1}])
        ans_30_2 = test_query(f, "TC-30-Q2", "What are the best places to visit in Vietnam?", history=hist_30)
        hist_30.extend([{"role": "user", "content": "What are the best places to visit in Vietnam?"}, {"role": "assistant", "content": ans_30_2}])
        test_query(f, "TC-30-Q3", "What country am I from?", history=hist_30)
