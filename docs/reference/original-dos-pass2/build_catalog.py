from pathlib import Path
import json, csv, hashlib, zipfile
D=Path(__file__).resolve().parent
SHOP={
 'market':(203,3,[('Food for one week',1,55,1,1,0),('Food for two weeks',1,100,2,1,0),('Food for four weeks',1,190,4,1,0),('10 lottery tickets',9,10,10,1,1),('Newspaper',8,1,1,3,1)]),
 'fastFood':(210,10,[('Hamburgers',3,79,1,1,0),('Cheeseburger',4,89,1,1,0),('Astro Chicken',2,124,1,1,0),('Fries',5,65,1,1,0),('Shakes',6,102,1,3,0),('Colas',7,69,1,3,0)]),
 'clothing':(209,9,[('Business Suit',34,295,13,1,0),('Dress Clothes',35,125,13,1,0),('Casual Clothes',36,73,11,1,0)]),
 'appliance':(208,8,[('Refrigerator',21,876,1,0,0),('Freezer',22,513,1,0,0),('Stove',23,570,1,0,0),('Color TV',24,525,1,0,0),('VCR',25,333,1,0,0),('Stereo',26,412,1,0,0),('Microwave',27,330,1,0,0),('Hot Tub',28,1255,1,0,0),('Computer',29,1599,1,0,0)]),
 'rentOffice':(201,1,[('Rent Low-Cost Apartment',40,325,4,1,0),('Rent Security Apartment',41,475,4,1,0)]),
}
items=[]
for shop,(script,place,goods) in SHOP.items():
    for label,index,price,qty,typ,fixed in goods:
        items.append({'placeNum':place,'sourceScript':script,'sourceFile':shop+'.sc','name':label,'itemIndex':index,'basePriceOrFixedPrice':price,'units':qty,'typeOfGoods':typ,'fixedPrice':bool(fixed),'note':'Currency values are original game units, not modern prices.'})
(D/'original_shops.json').write_text(json.dumps({'version':'1.000.060','source':'decompiled location scripts matching game version; original installation was not executed','items':items},indent=2)+'\n')
with (D/'original_shops.csv').open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(items[0]));w.writeheader();w.writerows(items)

ai=[
(1,'unemployed','travel to employment office',232),
(2,'rent due and missing food, adequate clothing & funds','combine rent office and food-oriented stop',240),
(3,'rent due, missing food, clothing low, sufficient funds','plan rent plus food and clothing',260),
(5,'rent cycle & clothing depleted','buy clothing',290),
(7,'rent affordable','pay rent',317),
(8,'rent shortfall; current job and workwear','work enough to cover rent, if feasible in available time',325),
(9,'rent shortfall; withdrawals possible','visit bank',350),
(10,'rent shortfall and eligibility','ask landlord for extension',367),
(11,'rent shortfall covered by durables','pawn possessions',382),
(12,'no workwear and cash short','withdraw money for clothes',396),
(13,'no workwear and pawnable durables','pawn valuables for clothes',414),
(14,'no workwear, adequate cash','buy clothing',426),
(17,'food and clothing affordability constraint; working viable','work before shopping',458),
(20,'clothing worn/missing; cash adequate','buy clothing',553),
(21,'food shortage; can work to fund it','work for food',604),
(22,'food shortage; bank funds','withdraw for food',631),
(23,'food shortage; pawnable assets','sell/pawn for food',644),
(24,'cash sufficient for food and work, wants market goods','go to work or market, route optimized',660),
(28,'pay raise available','go to employment office',759),
(29,'promotion thresholds met','go to employment office',776),
(30,'work experience or reliability low','work for progression',792),
(31,'pawned items while employed','redeem pawned property',833),
(32,'relaxation at 10','go home',857),
(33,'relaxation below 17','work then rest',865),
(34,'can afford education, time available, random gate','consider work plus university',877),
(35,'cash >1500 and happiness goal not met','consider appliances',905),
(36,'work remains productive','continue working',924),
(37,'low relaxation','rest at home',932),
(38,'pawned goods and funds available','retrieve pawned assets',944),
(39,'funds >800 and happiness goal not met','consider discount store leisure goods',958),
(40,'funds >800 and happiness goal not met','consider appliances',977),
(42,'available funds and investment conditions','invest/adjust bank holdings',1000),
(43,'investment index weak','consider liquidating investments',1019),
(44,'eligible/affordable education','go to university',1038),
(46,'has work and appropriate clothing','work a standard block',1060),
(47,'already at university and time nearly exhausted','use remaining time for school',1074),
(48,'already at workplace and time nearly exhausted','use remaining work time',1091),
(49,'nothing else viable','go home',1105),
]
(D/'ai_branch_map.json').write_text(json.dumps({'version':'1.000.060','script':'WhereShouldIGo.sc','scriptNumber':300,'semantics':'first matching branch wins; branch descriptions condensed; numeric IDs are DEBUG/decision tags (global403), not location identifiers','coverage':'Selected representative branches: not all 50+ tags are included','branches':[dict(branchId=i,precondition=s,consequence=a,sourceLine=line) for i,s,a,line in ai]},indent=2)+'\n')

weekly=[
 {'startTrnState':2,'name':'lottery_draw','details':'Roll 0..500; ticket_quantity>roll qualifies; prize 5000, 500 or 200 based on the roll/ticket ratio; ticket count reset','sourceLines':'214-237','confidence':'verified in decompilation'},
 {'startTrnState':4,'name':'computer_owned_lottery_like_bonus','details':'If owned durable item 29 and 1/7 roll, adds 20..100 cash','sourceLines':'247-260','confidence':'verified in decompilation; semantic interpretation of item is computer (appliance.sc)'},
 {'startTrnState':6,'name':'relaxation_and_unsecured_property','details':'If no hot tub item 28, relax drops 1 toward floor 10; if in low-cost housing, chance of losing some items','sourceLines':'265-323','confidence':'verified in decompilation'},
 {'startTrnState':10,'name':'food_storage','details':'Food item 1 may be lost without refrigerator 21, may be capped at 6 without freezer 22, or at 12 with it','sourceLines':'347-379','confidence':'verified in decompilation'},
 {'startTrnState':12,'name':'consumables_cleanup_and_hunger','details':'Clears food IDs 3..5 and triggers food shortage event if no available food','sourceLines':'384-400','confidence':'verified in decompilation'},
 {'startTrnState':14,'name':'cash_stress','details':'If no viable food and cash available, conditional money loss (capped by current funds, income bands) and happiness decrease','sourceLines':'405-433','confidence':'verified logic, event narrative pending original game validation'},
 {'startTrnState':16,'name':'weekly_consumption_and_housing','details':'Consumables reduce quantities; every fourth week checks rent consumable for current apartment type','sourceLines':'437-455','confidence':'verified in decompilation'},
 {'startTrnState':18,'name':'work_clothes_check','details':'Recompute clothing and avatar appearance, issue warning at only one week clothing remaining','sourceLines':'460-486','confidence':'verified in decompilation'},
 {'startTrnState':20,'name':'loan_due','details':'Every four weeks, loan schedules are checked for delinquency','sourceLines':'490-504','confidence':'verified in decompilation'},
 {'startTrnState':22,'name':'durable_event_risk','details':'Affluent player with flagged durables can incur rare loss of between ~5% and 25% of pricePaid, chance 1/36 or 1/51 depending on attribute','sourceLines':'509-592','confidence':'verified code, precise flag meaning unverified'},
 {'startTrnState':24,'name':'economic_headline','details':'Market crisis or boom applies happiness effects and investment-aware amplification','sourceLines':'596-644','confidence':'verified in decompilation'},
 {'startTrnState':26,'name':'scandal_all_players','details':'Economic crisis can remove employment or reduce wage; applies to each non-finished player','sourceLines':'648-775','confidence':'verified in decompilation'},
 {'startTrnState':34,'name':'emergency_clothing_assistance','details':'If cash <=0, no clothing, and nonpawned goods worth <200 for two checks, grant funds toward work clothes','sourceLines':'782-832','confidence':'verified in decompilation'},
]
(D/'weekly_events.json').write_text(json.dumps({'version':'1.000.060','scriptNumber':111,'script':'startTrn.sc','events':weekly},indent=2)+'\n')

sourcerecs=[
 ('Employment prerequisites and chance','employment.sc',206,'117-171'),
 ('Wage update and appointment','employment.sc',206,'206-286'),
 ('Working, firing, wages, time','n108.sc',108,'17-173'),
 ('Price coefficient transform','n109.sc',109,'10-47'),
 ('Buying goods and costs','WButton.sc',104,'162-256'),
 ('Economic market indices','economicIndex.sc',107,'28-146;202-278'),
 ('Time counter and tick pacing','room1.sc',1,'1473-1507'),
 ('Reliability and rent endTurn','room1.sc',1,'730-810'),
 ('Weekly start and random events','startTrn.sc',111,'180-832'),
 ('Player AI priorities and routing','WhereShouldIGo.sc',300,'13-1107'),
 ('Lotteries','startTrn.sc',111,'214-237'),
 ('Rental extension','rentOffice.sc',201,'290-359'),
 ('Four-goal weighted display','viewGoals.sc',238,'22-59'),
 ('Victory checks','startTrn.sc',111,'57-164'),
 ('Market price sources','market.sc',203,'265-460'),
 ('Retail food','fastFood.sc',210,'258-383'),
 ('Clothing tiers','clothing.sc',209,'selected CostDItem instances'),
 ('Durable types','appliance.sc',208,'selected CostDItem instances'),
 ('Money and happiness stat mutators','Main.sc',0,'1038-1109'),
 ('Consumable weekly decay','Goods.sc',106,'7-33'),
]
with (D/'evidence_index.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['Finding','File','SCIScript','LineRange','SourceURL']);
 for title,file,num,lines in sourcerecs:
  w.writerow([title,file,num,lines,'https://github.com/sluicebox/sci-scripts/blob/main/jones-dos-1.000.060/src/'+file])

rules={'game':'Jones in the Fast Lane','version':'1.000.060','classification':'reference implementation; model input for The Life Loop, not live integration','turn':{'timeCap':60,'ticksPerTimeUnitDefault':20,'endTurnDependabilityLoss':3,'monthlyCycleWeeks':4,'workTimeCost':6,'workPayHours':8,'jobApplicationTimeCost':4,'employmentScreenEnterCost':2},'hiring':{'degreeBonusMultiplier':8,'experienceAndDependabilityRandomOffset':10,'chanceBase':30,'specialAlwaysPassRandomOccupationId':44,'firingBelowMinDependabilityMinus':5,'warningBelowMinDependabilityMinus':2},'economy':{'initialGoodsReading':100,'priceMin':1,'priceIndexMin':50,'priceReadingBound':[10,190],'dynamicForFixedPriceFalse':True,'costBasis':'adjusted goods index (global309)'},'goals':{'tracks':['money','happiness','education','career'],'defaultGoalEach':50,'careerStepDependability':8,'careerStepPoints':10,'cashPerMoneyGoalPointApproximate':100,'allFourRequired':True},'rent':{'initialLowCost':325,'baseSecurity':475,'everyWeeks':4,'askExtensionRolld12':{'-1':'deny','0':'guarantee','1':'roll>3','2':'roll>6','3+':'roll>9'}},'lottery':{'rollMin':0,'rollMaxInclusive':500,'winIf':'quantity>roll','jackpotIf':'roll<=floor(quantity/20)','secondTierIf':'roll<=floor(quantity/5)','awards':[5000,500,200],'clearTicketsOnDraw':True},'dataFiles':['reference/pass1/original_jobs.json','reference/pass1/original_route.json','reference/pass1/original_education.csv','original_shops.json','ai_branch_map.json','weekly_events.json'],'status':'numeric and flow models source-matched; not validated through live DOS runtime'}
(D/'classic_rules.json').write_text(json.dumps(rules,indent=2)+'\n')

if __name__=='__main__': print(f'{len(items)} store offerings, {len(ai)} selected AI states, {len(weekly)} event categories, {len(sourcerecs)} evidence refs')
