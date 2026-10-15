# Classic-compatible migration test scenarios

Tests in `tests/test_classic_rules.py` cover the mathematical reference.
Use the following **integration scenarios** with a seeded random provider after porting.

| ID | Given | When | Then | Sources |
|---|---|---|---|---|
| C01 | index 80 | buy one week food | price 36; +1 week; cash decreases | n109.sc, market.sc, WButton.sc |
| C02 | index 100 | buy 10 tickets | costs 10; tickets +10; price fixed on next market change | market.sc |
| C03 | 10 tickets | roll=0 at start | +5000 cash, tickets=0 | startTrn.sc |
| C04 | 10 tickets | roll=10 | no win, tickets=0 | startTrn.sc |
| C05 | t=57, $7/h job, appropriate clothes | work | gross pay $28 before debt; time=60 | n108.sc |
| C06 | job minDependability=20, player=14 | work | dismissed | n108.sc |
| C07 | job minDependability=20, player=16, first work this turn | work | warning, otherwise work can proceed | n108.sc |
| C08 | dependability=2 | finish turn | dependability=0 | room1.sc |
| C09 | cash=350, base apartment rent=325, due week | pay | prepaid housing time recorded, cash down 325 | rentOffice.sc |
| C10 | rent extension counter 1, RNG=3 | ask | declined; attempted flag set | rentOffice.sc |
| C11 | rent extension counter 1, RNG=4 | ask | approved for a week; attempts restricted | rentOffice.sc |
| C12 | low-cost housing + bulk food; no fridge | next weekly check | extra groceries can spoil | startTrn.sc |
| C13 | apartment low cost, no hot tub, relax=12 | next week | relax=11 | startTrn.sc |
| C14 | full career, money, happiness, education but one point short | evaluate win | not won | startTrn.sc |
| C15 | no employer and player Jones | take action | travel to ACNE, place 6 | WhereShouldIGo.sc |
| C16 | pawn at route index 35, destination route index 24 | route | shortest 11-step backward, no teleport | marblePath.sc |
| C17 | job occupation 44 + missing degree requirement | apply and roll 100 | cook RNG bypass does not remove other qualifying gates | employment.sc |
| C18 | all four players / crisis severity 2 | start event | affected players resolved individually, independent RNG and event logs | startTrn.sc |
| C19 | current goods index 120, base food 55 | quote food | price 72, not 66 from simplistic 20% markup | n109.sc |
| C20 | Jones low relaxation and no emergency needs | evaluate | rest/home branch prioritized where original conditions match | WhereShouldIGo.sc |

*Integration fixtures must compare event ordering and game state to an emulator trace before declaring bit-exact compatibility.*
