# Sacramento: the derived court counts do not hold

Written 2026-09-03, after the verification run and before anything published.

## What was claimed

`scripts/verify/apply-sacramento-parks.mjs` derived a court count for each park
by counting rows in the City of Sacramento Public Park Amenities layer with
`Amenity` of "Pickle Ball Court" or "Tennis Court-Pickle Ball". The method was
tested on the largest site, Garcia Bend Park, and the evidence string published
with every count read:

> Points are distinct, spaced 5.2m to 29.1m apart — consistent with adjacent
> courts (a court is 13.4m x 6.1m), not with duplicate records of one court.

## Why it does not hold

**1. The validating arithmetic was wrong.** The script header argued "Eight
courts in a bank span roughly 30 m, which is what the furthest pair measures."
Eight courts side by side span 8 x 6.1 m = 48.8 m. The measured span of 29.1 m
is too small for eight courts by nearly twenty metres. The test that was
supposed to falsify the derivation could not have failed.

**2. The points come in pairs with a constant offset.** Garcia Bend's eight
points are four tight pairs, and every pair has the same offset vector:

| pair | dx | dy | distance | bearing |
| --- | --- | --- | --- | --- |
| 5753 -> 5754 | 4.5 | 3.4 | 5.6 m | 37 deg |
| 5755 -> 5756 | 4.2 | 3.2 | 5.3 m | 37 deg |
| 5757 -> 5758 | 4.9 | 3.7 | 6.1 m | 37 deg |
| 5759 -> 5760 | 4.7 | 4.0 | 6.2 m | 40 deg |

Four independent courts do not produce four identical offset vectors. A
separation of ~6.1 m at a constant bearing is the width of a court — these read
as the two ends of one net line, recorded per court. That makes Garcia Bend
four courts, not eight.

**3. A local source says four.** Sactown Pickleball Club lists Garcia Bend as
"4 outdoor courts". Independent agreement with the corrected reading.

**4. The corrected reading then fails somewhere else.** Southside Park's four
points are also two pairs with a constant offset (6.5 m at 164 deg, 6.4 m at
160 deg). Two nets, so two courts. But the club says six and the commercial
import says six.

So the point-per-court rule overcounts Garcia Bend, the pair-per-court rule
undercounts Southside, and no single rule fits both parks in the same dataset.
Across the fourteen parks the spacing between pickleball points takes values of
5.2, 5.6, 6.1, 6.2, 6.3, 6.4, 9.0, 9.3, 14.4, 14.9, 15.3, 15.6, 16.5, 17.3,
18.5 and 18.5 metres, with no consistent unit.

## What follows

The layer is not a court-count source. It states park identity, address,
amenity type and public status, and those remain good. The counts were an
inference, the inference is contradicted, and under Rule 7 an inference a
source contradicts does not publish.

Import Gate I3 requires a verified court count, so withdrawing the counts means
no Sacramento venue promotes and the city page fails Gate 1. Sacramento does
not publish on this source alone.

## What was right

Gate I3 and the gates generally did their job — nothing reached a reader. The
error was mine, in the validation step, and it was caught by looking for a
second source rather than by the pipeline.
