"""One-shot durable turn-ready delivery, designed for LoopRD/server scheduler.

Operator provides an importable private implementation with
send_turn_ready(event) -> literal True when accepted durably and idempotently.
Do not execute on game clients, and do not embed sender credentials in LoopRD YAML.
"""
import importlib
import os
import sys
from pathlib import Path
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

sys.path.insert(0,str(Path(__file__).resolve().parent))


def run_once():
    module_name=os.environ.get('LIFE_SOCIAL_NOTIFY_MODULE','')
    database=os.environ.get('LIFE_PLAY_DATABASE_URL','')
    if not module_name or not module_name.replace('_','').replace('.','').isalnum() or not database or not (
        database.startswith('sqlite:///') or database.startswith('postgresql+')) or database.endswith(':memory:'):
        raise RuntimeError('Trusted notification adapter and durable Life database required')
    module=importlib.import_module(module_name)
    fn=getattr(module,'send_turn_ready',None)
    if not callable(fn): raise RuntimeError('Trusted send_turn_ready implementation required')
    from async_turn_notifications import TurnReadyDispatcher
    engine=sa.create_engine(database,pool_pre_ping=True)
    try:
        return TurnReadyDispatcher(sessionmaker(bind=engine),fn).flush(limit=50)
    finally:
        engine.dispose()


if __name__=='__main__':
    result=run_once()
    print('Life notifications: '+', '.join(f'{k}={v}' for k,v in result.items()))
