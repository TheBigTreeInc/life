"""Jones DOS 1.000.060 classic simulation reference: independently written formulas.

Sources: version-matched sluicebox SCI decompilation, NOT an executable port.
This is an educational specification of selected *confirmed* formulas only.
Integer overflow, random generator, event ordering, and data mutation behavior
in the 16-bit SCI interpreter require subsequent empirical verification.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional

PATH_LENGTH = 170
TIME_PER_TURN = 60
DEFAULT_TICKS_PER_TIME_UNIT = 20
DEFAULT_WORK_TIME = 6
WORK_HOURS = 8
RELIABILITY_LOSS_PER_TURN = 3
MONEY_GOAL_DIVISOR = 100


def truncdiv(a: int, b: int) -> int:
    """SCI-style truncation toward zero for integer division (no 16-bit overflow)."""
    if b == 0:
        raise ZeroDivisionError("SCI division by zero")
    return (1 if (a >= 0) == (b >= 0) else -1) * (abs(a) // abs(b))


def adjusted_market_index(reading: int) -> int:
    """n109.sc proc109_0, first stage; floor 50."""
    if reading < 100:
        value = reading - truncdiv((100 - reading) * 2, 3)
    else:
        value = reading + truncdiv((reading - 100) * 2, 3)
    return max(50, value)


def economic_price(reading: int, base_price: int) -> int:
    """n109.sc proc109_0 + WButton.sc CostDItem.init; no SCI overflow emulation.

    The original splits multiplication into tens / remainder steps, causing
    rounding which is NOT always the same as floor(base*adjusted/100).
    """
    if base_price < 0:
        raise ValueError("base_price must be >= 0")
    idx = adjusted_market_index(reading)
    result = truncdiv(base_price * truncdiv(idx, 10), 10)
    result += truncdiv(base_price * (idx % 10), 100)
    return max(1, result)


def circle_steps(a: int, b: int, size: int = PATH_LENGTH) -> int:
    """Smallest count of waypoint transitions, from marblePath.sc."""
    if not (1 <= a <= size and 1 <= b <= size):
        raise ValueError("route indices out of bounds")
    fwd = (b - a) % size
    backward = (a - b) % size
    return min(fwd, backward)


def ai_route_tick_estimate(stops: list[int], ticks_per_unit: int = DEFAULT_TICKS_PER_TIME_UNIT) -> int:
    """WhereShouldIGo.sc localproc_1: path steps + 2*ticks per leg.

    Argument list has place-index waypoint positions, not placeNum identifiers.
    """
    if len(stops) < 2:
        return 0
    return sum(circle_steps(a,b) + 2 * ticks_per_unit for a,b in zip(stops, stops[1:]))


def advance_time(current: int, units: int, max_time: int = TIME_PER_TURN) -> int:
    """Explicit time action update: cap at 60, never reduce by an action."""
    if units < 0:
        raise ValueError("action cost may not be negative")
    if current < 0:
        raise ValueError("current time cannot be negative")
    return min(max_time, current + units)


def work_gross_pay(wage_per_hour: int, current_time: int) -> int:
    """n108.sc localproc_0: partial eight-hour pay over six turn units.

    At 60, n108.proc108_0 rejects work; hence this function returns 0.
    """
    if wage_per_hour < 0 or not 0 <= current_time <= TIME_PER_TURN:
        raise ValueError("invalid wage/time")
    full = wage_per_hour * WORK_HOURS
    if current_time >= TIME_PER_TURN:
        return 0
    remaining = TIME_PER_TURN - current_time
    return full if remaining >= DEFAULT_WORK_TIME else truncdiv(full * remaining, DEFAULT_WORK_TIME)


def employment_probability_threshold(dependability: int, experience: int, degree_count: int) -> int:
    """employment.sc JobDItem.qualify, chance threshold, before requirements check."""
    edu_component = degree_count * 8 + 10
    return 30 + truncdiv(dependability + experience + edu_component, 3)


def qualifies_for_job(*, dependability: int, experience: int, degrees: set[int],
                      needed_dependability: int, needed_experience: int,
                      first_degree: int = 0, second_degree: int = 0) -> bool:
    """Three deterministic qualification gates; acceptance RNG is separate."""
    return (
        (not first_degree or first_degree in degrees)
        and (not second_degree or second_degree in degrees)
        and dependability >= (needed_dependability - (10 if needed_dependability == 10 else 0))
        and experience >= needed_experience
    )


def accepted_job(*, qualifying: bool, dice_1_to_100: int,
                 threshold: int, occupation_id: int) -> bool:
    """employment.sc special-cases occupation 44 (Cook); other gates still apply."""
    if not 1 <= dice_1_to_100 <= 100:
        raise ValueError("dice roll must be 1-100")
    return qualifying and (occupation_id == 44 or dice_1_to_100 <= threshold)


def apply_end_turn_dependability(value: int) -> int:
    """room1.sc Player.endTurn; only reliability portion of the turn handler."""
    return max(0, value - RELIABILITY_LOSS_PER_TURN)


def work_outcome(dependability: int, min_dependability: int) -> str:
    """n108.sc proc108_0: after clothing check; warning only when global329 set.

    The 'warning' classification must be gated by global329 in a full port.
    """
    if dependability < min_dependability - 5:
        return "fired"
    if dependability < min_dependability - 2:
        return "warning_if_eligible"
    return "work_allowed"


def weekly_quantity(quantity: int) -> int:
    """Goods.sc Consumable.doit decrements a positive stack once per tick."""
    return max(0, quantity - 1)


def lottery_win(ticket_quantity: int, roll_0_to_500: int) -> int:
    """startTrn.sc state 2, one roll and clear tickets irrespective of win.

    Returns zero for no prize; caller must clear ALL tickets after this roll.
    """
    if ticket_quantity < 0 or not 0 <= roll_0_to_500 <= 500:
        raise ValueError("invalid ticket quantity/roll")
    if ticket_quantity <= roll_0_to_500:
        return 0
    if roll_0_to_500 <= truncdiv(ticket_quantity, 20):
        return 5000
    if roll_0_to_500 <= truncdiv(ticket_quantity, 5):
        return 500
    return 200


def extension_allowed(previous_extensions: int, roll_1_to_12: int) -> bool:
    """rentOffice.sc moreTime, before triedExt and housing-payment checks.

    rentExt=-1 denies extension; 0 always permits; 1-2 and >=3 roll.
    """
    if not 1 <= roll_1_to_12 <= 12:
        raise ValueError("roll must be in 1-12")
    if previous_extensions == -1:
        return False
    if previous_extensions == 0:
        return True
    if previous_extensions == 1:
        return roll_1_to_12 > 3
    if previous_extensions == 2:
        return roll_1_to_12 > 6
    return roll_1_to_12 > 9


def goal_progress_pct(stats: tuple[int,int,int,int], goals: tuple[int,int,int,int]) -> int:
    """viewGoals.sc localproc_0: capped weighted total, integer percent."""
    if len(stats) != 4 or len(goals) != 4 or any(x <= 0 for x in goals):
        raise ValueError("require four positive goal targets")
    total = sum(min(stat,goal) for stat,goal in zip(stats,goals))
    total_goal = sum(goals)
    return min(100, truncdiv(total * 100, total_goal))


def has_won(stats: tuple[int,int,int,int], goals: tuple[int,int,int,int]) -> bool:
    """startTrn.sc states 0 and 2: all four individual thresholds required."""
    return len(stats) == len(goals) == 4 and all(x >= y for x,y in zip(stats,goals))


def career_stat(dependability: int, employed: bool) -> int:
    """room1.sc Player.endTurn, n108.sc; integer-step career-stat formula."""
    return min(100, truncdiv(dependability, 8) * 10) if employed else 0


def education_stat(degrees_completed: int) -> int:
    """university.sc UniversityDIcon.doit, recomputed on qualification award."""
    if degrees_completed < 0:
        raise ValueError("negative degrees")
    return 0 if degrees_completed == 0 else 1 + 9 * degrees_completed


def baseline_ai_decision(*, employed: bool, food_weeks: int, clothing_weeks: int,
                          dressed_for_work: bool, available_cash: int,
                          rent_due: int, rent_due_this_week: bool) -> str:
    """ILLUSTRATIVE minimal policy, NOT the exact 1111-line SCI decision tree!

    For integration smoke tests only. Replace with full ordered SCI branch port.
    """
    if not employed:
        return 'employment'
    if rent_due_this_week and available_cash >= rent_due:
        return 'pay_rent'
    if food_weeks <= 0:
        return 'buy_food'
    if clothing_weeks <= 0 or not dressed_for_work:
        return 'buy_clothing'
    return 'work_or_advance'
