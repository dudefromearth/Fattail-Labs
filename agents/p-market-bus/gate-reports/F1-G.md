# F1-G — Chain feed process (MB-P2)
**Result:** PASS (landed)  
- `python -m market_data.chain_feed --once|--interval`  
- Refreshes interest keys `mb:ladder:*` from Redis  
- Request path uses single-flight + Redis; feed is sole continuous warmer  
