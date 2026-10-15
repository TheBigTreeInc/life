"""Smoke/regression checks for extracted legacy data. Run: python test_reference.py"""
import csv, json, unittest
from pathlib import Path
BASE=Path(__file__).parent
DATA=json.loads((BASE/'original_route.json').read_text(encoding='utf-8'))
JOBS=json.loads((BASE/'original_jobs.json').read_text(encoding='utf-8'))['jobs']
COURSES=list(csv.DictReader((BASE/'original_education.csv').open(encoding='utf-8')))


def route_indices(a,b,clockwise=None):
    """1-based path indices, inclusive endpoints; clockwise is increasing indices."""
    assert 1 <= a <= 170 and 1 <= b <= 170
    plus=(b-a)%170; minus=(a-b)%170
    if clockwise is None:clockwise=plus<=minus
    count=plus if clockwise else minus
    return [((a-1+(i if clockwise else -i))%170)+1 for i in range(count+1)]

class ReferenceTests(unittest.TestCase):
    def test_waypoints(self):
        points=DATA['waypoints'];self.assertEqual(len(points),170)
        self.assertEqual([p['index'] for p in points],list(range(1,171)))
        self.assertTrue(all(0<=p['x']<320 and 0<=p['y']<200 for p in points))
    def test_anchor_integrity(self):
        points=DATA['waypoints'];places=DATA['places'];self.assertEqual(len(places),13)
        for p in places:
            wp=points[p['pathIndex']-1]
            self.assertEqual((p['x'],p['y']),(wp['x'],wp['y']))
    def test_shortest_route_wrap(self):
        self.assertEqual(route_indices(1,164),[1,170,169,168,167,166,165,164]);self.assertEqual(len(route_indices(35,24))-1,11)
        self.assertEqual(len(route_indices(1,1)),1)
        self.assertEqual(len(route_indices(1,86))-1,85)
    def test_jobs_linked_to_businesses(self):
        self.assertEqual(len(JOBS),37);self.assertEqual(sorted(j['jobNum'] for j in JOBS),list(range(1,38)))
        places={x['placeNum'] for x in DATA['places']}
        for j in JOBS:self.assertIn(j['placeNum'],places)
        self.assertEqual([j['role'] for j in JOBS if j['business']=='Monolith Burgers'],['cook','clerk','assistManager','manager'])
    def test_degree_references(self):
        ids={int(c['degreeId']) for c in COURSES};self.assertEqual(ids,set(range(10,21)))
        for c in COURSES:
            need=int(c['requiredDegreeId']);self.assertTrue(need==0 or need in ids)
        for j in JOBS:
            for key in ('requiredDegree1','requiredDegree2'):
                self.assertTrue(j[key]==0 or j[key] in ids,(j['role'],j[key]))
if __name__=='__main__':unittest.main(verbosity=2)
