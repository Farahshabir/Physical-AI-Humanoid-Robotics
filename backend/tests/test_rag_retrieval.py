
import unittest
import asyncio
import json
from backend.agent import retrieve

class TestRagRetrieval(unittest.TestCase):
    def test_retrieve_from_qdrant(self):
        """
        Tests that the retrieve function returns a list of payloads from Qdrant.
        """
        query = "what is physical ai?"
        
        # The retrieve function is async, so we need to run it in an event loop
        # However, the retrieve function itself is not async.
        # It's the agent that is async.
        # The function_tool decorator doesn't make the function async.
        # So we can call it directly.
        
        # But looking at the main function in agent.py, it uses asyncio.run(main())
        # and the main function is async. Let's see if we can call retrieve directly.
        # The retrieve function is not an async function, so we can call it directly.
        
        results = retrieve(query)
        
        print("---- Qdrant Retrieval Test Results ----")
        print(json.dumps(results, indent=2))
        print("------------------------------------")
        
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0, "Qdrant should return some results for the query.")
        
        for item in results:
            self.assertIsInstance(item, dict)
            self.assertIn("text", item)
            self.assertIn("url", item)
            self.assertIn("chunk_id", item)
            
            self.assertIsInstance(item["text"], str)
            self.assertIsInstance(item["url"], str)
            self.assertIsInstance(item["chunk_id"], int)

if __name__ == '__main__':
    unittest.main()
