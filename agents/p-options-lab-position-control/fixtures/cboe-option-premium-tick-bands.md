# Cboe option premium tick bands — PC1 fixture

**Status:** FILLED 2026-09-11 from published Cboe contract specifications and Rule 5.4.  
**Consumer:** `web/lib/options-lab/tickSize.ts`. Unknown product → fail loud (PC-CHAIN-7). No invented default.

Tick is the **simple-order** minimum increment (package BASIS). Complex-order increments are out of this table.

| Product | Premium band | Tick | Source |
|---------|--------------|------|--------|
| SPX, SPXW | below 3.00 | 0.05 | [Cboe SPX product specification](https://ww2.cboe.com/tradable_products/sp_500/spx_options/specifications) (retrieved 2026-09-11): "Minimum tick for options trading below 3.00 is 0.05 ($5.00) and for all other series, 0.10 ($10.00)." Same sentence on [SPX fact sheet](https://cdn.cboe.com/resources/spx/spx-fact-sheet.pdf). |
| SPX, SPXW | 3.00 and higher | 0.10 | same |
| XSP | all premiums | 0.01 | [Cboe XSP product specification](https://www.cboe.com/tradable_products/sp_500/mini_spx_options/specifications) (retrieved 2026-09-11): "The minimum tick for XSP options is 0.01 ($1.00) for all series, including LEAPS." Cboe Rule 5.4(a): XSP $0.01 all prices as long as SPY participates in the Penny Interval Program. |
| SPY, QQQ, IWM | all premiums | 0.01 | Cboe Rule 5.4(a): "QQQs, IWM, and SPY … $0.01 All prices." [C1 Exchange Rule Book](https://cdn.cboe.com/resources/regulation/rule_book/C1_Exchange_Rule_Book.pdf) Rule 5.4. |
| Penny Interval class | below 3.00 | 0.01 | Cboe Rule 5.4(a) Class Participating in Penny Interval Program. A product is this class only when named in the Exchange's published Penny Program list — do not assume. |
| Penny Interval class | 3.00 and higher | 0.05 | same |
| Not in Penny Interval | below 3.00 | 0.05 | Cboe Rule 5.4(a) Class Not Participating in Penny Interval Program. |
| Not in Penny Interval | 3.00 and higher | 0.10 | same |

**Not in this table → fail loud.** Do not return 0.05, 0.01, or any other invented default.

Named products above are the only keys `tickSize.ts` accepts. SPXW shares SPX's published band. Penny Interval / non-penny class rows document the Rule; they are not a catch-all for unnamed underlyings.
