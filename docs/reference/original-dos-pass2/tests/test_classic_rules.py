import json
import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from classic_rules import *

class TestClassicRecoveredFormulas(unittest.TestCase):
    def test_market_base_index(self): self.assertEqual(adjusted_market_index(100),100)
    def test_market_downward_clamp(self): self.assertEqual(adjusted_market_index(70),50)
    def test_market_upward(self): self.assertEqual(adjusted_market_index(120),133)
    def test_price_base(self): self.assertEqual(economic_price(100,55),55)
    def test_price_down(self): self.assertEqual(economic_price(80,55),36)
    def test_price_up(self): self.assertEqual(economic_price(120,55),72)
    def test_price_minimum(self): self.assertEqual(economic_price(1,0),1)
    def test_price_not_just_multiply_floor(self): self.assertEqual(economic_price(120,4),5)
    def test_route_around_ring(self): self.assertEqual(circle_steps(1,164),7)
    def test_route_monolith_zmart(self): self.assertEqual(circle_steps(35,24),11)
    def test_route_symmetry(self):
        for a in [1,19,85,170]:
            for b in [1,14,121,170]: self.assertEqual(circle_steps(a,b),circle_steps(b,a))
    def test_route_tie(self): self.assertEqual(circle_steps(1,86),85)
    def test_route_tick_estimate(self): self.assertEqual(ai_route_tick_estimate([1,164]),47)
    def test_clock_capped(self): self.assertEqual(advance_time(58,7),60)
    def test_clock_negative_cost(self):
        with self.assertRaises(ValueError): advance_time(22,-1)
    def test_work_full_shift(self): self.assertEqual(work_gross_pay(7,0),56)
    def test_work_at_54(self): self.assertEqual(work_gross_pay(7,54),56)
    def test_work_partial(self): self.assertEqual(work_gross_pay(7,57),28)
    def test_work_zero_time(self): self.assertEqual(work_gross_pay(7,60),0)
    def test_hiring_threshold(self): self.assertEqual(employment_probability_threshold(20,10,0),43)
    def test_hiring_qualifications(self):
        self.assertTrue(qualifies_for_job(dependability=20,experience=10,degrees=set(),needed_dependability=10,needed_experience=10))
        self.assertFalse(qualifies_for_job(dependability=20,experience=10,degrees=set(),needed_dependability=40,needed_experience=10))
    def test_cook_exception_still_requires_other_gates(self):
        self.assertTrue(accepted_job(qualifying=True,dice_1_to_100=100,threshold=1,occupation_id=44))
        self.assertFalse(accepted_job(qualifying=False,dice_1_to_100=1,threshold=100,occupation_id=44))
    def test_firing_cutoff(self): self.assertEqual(work_outcome(14,20),'fired')
    def test_warning_cutoff(self): self.assertEqual(work_outcome(16,20),'warning_if_eligible')
    def test_reliability_decay(self): self.assertEqual(apply_end_turn_dependability(2),0)
    def test_reliability_decay_normal(self): self.assertEqual(apply_end_turn_dependability(20),17)
    def test_consumable_zero_floor(self): self.assertEqual(weekly_quantity(0),0)
    def test_consumable_use(self): self.assertEqual(weekly_quantity(4),3)
    def test_lottery_losing_roll(self): self.assertEqual(lottery_win(10,10),0)
    def test_lottery_jackpot(self): self.assertEqual(lottery_win(10,0),5000)
    def test_lottery_mid_prize(self): self.assertEqual(lottery_win(10,2),500)
    def test_lottery_small_prize(self): self.assertEqual(lottery_win(10,3),200)
    def test_lottery_probability_event_count(self):
        self.assertEqual(sum(lottery_win(10,x)>0 for x in range(501)),10)
    def test_rent_extension_initial(self): self.assertTrue(extension_allowed(0,1))
    def test_rent_extension_none(self): self.assertFalse(extension_allowed(-1,12))
    def test_rent_extension_second(self):
        self.assertFalse(extension_allowed(1,3)); self.assertTrue(extension_allowed(1,4))
    def test_rent_extension_later(self):
        self.assertFalse(extension_allowed(3,9)); self.assertTrue(extension_allowed(3,10))
    def test_goal_progress(self): self.assertEqual(goal_progress_pct((50,50,0,0),(50,50,50,50)),50)
    def test_goal_overshoot_clamped(self): self.assertEqual(goal_progress_pct((1000,50,50,50),(50,50,50,50)),100)
    def test_victory_individual_gates(self): self.assertFalse(has_won((100,100,100,49),(50,50,50,50)))
    def test_victory_all(self): self.assertTrue(has_won((51,50,53,100),(50,50,50,50)))
    def test_career_steps(self): self.assertEqual(career_stat(63,True),70)
    def test_career_unemployed(self): self.assertEqual(career_stat(100,False),0)
    def test_education_at_degree(self): self.assertEqual(education_stat(1),10)
    def test_education_at_no_degree(self): self.assertEqual(education_stat(0),0)
    def test_ai_model_explicitly_marked_illustrative(self):
        self.assertEqual(baseline_ai_decision(employed=False,food_weeks=0,clothing_weeks=0,dressed_for_work=False,available_cash=0,rent_due=325,rent_due_this_week=True),'employment')
    def test_reference_catalog_links(self):
        jobs=json.loads((ROOT/'reference/pass1/original_jobs.json').read_text())['jobs']
        route=json.loads((ROOT/'reference/pass1/original_route.json').read_text())
        places={int(p['placeNum']) for p in route['places']}
        self.assertEqual(len(jobs),37)
        self.assertTrue(all(x['placeNum'] in places for x in jobs))

if __name__ == '__main__': unittest.main(verbosity=2)
