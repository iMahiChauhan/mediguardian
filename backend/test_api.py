import httpx
import asyncio

async def test_api():
    async with httpx.AsyncClient() as client:
        payload = {
            "text": "I have a severe headache and high fever",
            "age": 30,
            "gender": "male"
        }
        print("Sending request to API Gateway...")
        response = await client.post("http://localhost:8000/api/symptoms", json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        print(response.json())

if __name__ == "__main__":
    asyncio.run(test_api())
