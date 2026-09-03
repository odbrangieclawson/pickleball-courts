# Portland verification - what the city states, and what we refused to publish

Run 2026-09-03. 11 venues, 59 courts (45 outdoor, 14 indoor), one source page.

| venue | courts | where | cost | nets | quoted from the city |
| --- | --- | --- | --- | --- | --- |
| `columbia-park` | 8 | outdoor | free | bring your own | "8 Outdoor hard courts, free, permanent lines, bring your own net. Amenities: restrooms and water." |
| `pier-park` | 4 | outdoor | free | bring your own | "4 Outdoor concrete courts, free, permanent lines, bring your own net. Amenities: restrooms." |
| `sellwood-park` | 8 | outdoor | free | bring your own | "8 Outdoor hard courts, free, permanent lines, bring your own net. Amenities: restrooms and water." |
| `laurelhurst-park` | 2 | outdoor | free | provided | "2 Outdoor 'pickleball only' hard courts, free, permanent lines, nets included. Amenities: restrooms and water." |
| `gabriel-park` | 6 | outdoor | free | provided | "6 Outdoor 'pickleball only' hard courts, free, permanent lines, nets included. Amenities: restrooms and water." |
| `hillside-park` | 1 | outdoor | free | bring your own | "1 outdoor 'pickleball only' hard court, free, bring your own net." |
| `east-portland-community-center` | 4 | indoor | drop_in_fee | not stated | "4 courts, $6 for adults/$5 for seniors" |
| `southwest-community-center` | 5 | indoor | drop_in_fee | not stated | "5 courts, $6 for adults/$5 for seniors" |
| `st-johns-community-center` | 2 | indoor | drop_in_fee | not stated | "2 courts, $6/Adult and $5 for seniors" |
| `montavilla-community-center` | 3 | indoor | drop_in_fee | not stated | "3 courts, $6 for adults/$5 for seniors" |
| `portland-tennis-center` | 16 | outdoor | not stated | provided | "16 outdoor hard courts, permanent lines, nets provided. Available from mid June until early September." |

## Stated by the city, refused by us

| what | where | why refused |
| --- | --- | --- |
| surface "hard courts" | 9 of 11 venues | The surface vocabulary refuses "hard": asphalt, concrete and acrylic are all hard, so the word names a category, not a material. Pier Park ("concrete") and the two wood-floored community centres pass. |
| "permanent lines" | 9 venues | Real and useful, but there is no field for it, and a verification run is the wrong place to invent one. |
| "nets provided" | Southwest CC, St. Johns CC | Stated only in their second listing, which describes a registered programme, not drop-in play. |
| a fee | Portland Tennis Center | Registration runs through ActiveNet and the page names no figure. |
| venue_type | Portland Tennis Center | Municipal tennis centre: not a park, not a club, not a community centre. The nearest wrong answer is still wrong. |

## Not stated anywhere on the page

Lighting, at all eleven venues. `light` is null, not false.

## Values a source changed

| venue | field | was | now | outcome |
| --- | --- | --- | --- | --- |
| `sellwood-park` | total_courts | 1 | 8 | overridden |
| `sellwood-park` | street_address | "7900 Southeast Grand Avenue" | "7987 SE Grand Ave" | overridden |
| `sellwood-park` | outdoor_courts | 1 | 8 | overridden |
| `sellwood-park` | amenities | ["Drop In"] | ["Restrooms","Drinking water"] | overridden |
| `sellwood-park` | hours_of_operation | "No Regularly Schedule Play Here. Please Contact Me If You Would Like Me To Help You Start Something" | "Dawn to dusk" | overridden |
