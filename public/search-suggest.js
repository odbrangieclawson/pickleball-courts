/*
  ============================================================
  NEARBY SUGGESTIONS UNDER THE SEARCH BOX
  ============================================================

  Tap the search field and it offers the cities, counties and courts
  nearest to you, before you have typed anything. Type, and the same list
  narrows. It is the one feature Pickleheads has that this directory
  visibly lacked.

  ------------------------------------------------------------
  WHY THIS IS A PLAIN SCRIPT AND NOT A REACT COMPONENT
  ------------------------------------------------------------

  Rule 1 is immutable: every page renders its full content, links and
  schema in raw HTML with JavaScript disabled, no exceptions. So the search
  box is, and stays, a <form method="get"> that posts to /search/ and is
  answered by the server. Everything in this file is layered on top of a
  control that already works without it.

  Making it a client component would have meant hydrating React on the home
  page. The site's largest claim against its competitors is that it needs
  no JavaScript to show you anything, and shipping ~90 KB of framework to
  decorate a text input would have cashed that claim in for a dropdown.
  This is about seven kilobytes, it is deferred, and if it fails to load,
  never loads, or throws, the search box behaves exactly as it does today.

  Everything below degrades in that direction on purpose. There is no state
  in here that the page depends on.

  ------------------------------------------------------------
  WHERE THE LOCATION COMES FROM, IN TWO TIERS
  ------------------------------------------------------------

  1. COARSE, NO PROMPT. /api/where/ reports the city Vercel resolves the
     requesting IP to. No dialog, no third party, nothing stored, and it is
     derived from an address the host logs anyway. Distances against it are
     measured from a city, not from a person, so they are labelled
     "about". This is what makes the first tap useful.

  2. PRECISE, ON EXPLICIT REQUEST. A button asks the browser for real
     coordinates. THOSE COORDINATES ARE NEVER SENT ANYWHERE. The ranking
     runs here, in the page, against /suggest.json; there is no endpoint on
     this site that accepts a position, so there is nothing for anyone to
     receive, log or leak.

  Nothing is written to localStorage, sessionStorage, IndexedDB or a
  cookie. The privacy policy's audit says this site stores nothing on your
  device and that stays true. A returning visitor who has already granted
  permission is upgraded to precise silently, by asking the Permissions API
  whether the answer is already "granted" rather than by remembering it
  ourselves. The browser is a better place to keep that than we are.
*/
;(function () {
  'use strict'

  var forms = document.querySelectorAll('form[data-suggest]')
  if (!forms.length) return
  if (!window.fetch || !document.createElement('div').closest) return

  var INDEX_URL = '/suggest.json'
  var WHERE_URL = '/api/where/'

  var MAX_PLACES = 3
  var MAX_COURTS = 6
  var MAX_PLACES_TYPING = 4
  var MAX_BROWSE = 7

  /*
    ------------------------------------------------------------
    HOW FAR AWAY IS TOO FAR TO SAY "NEAR YOU"
    ------------------------------------------------------------

    Knowing where somebody is does not mean we have anything to offer
    them. This directory publishes thirty-five US cities; most of the
    planet is nowhere near one of them. Ranked purely by distance, a
    visitor in Manila was shown "NEAR MANILA" over a list of Seattle parks
    "about 6,637 miles away" — a true number attached to a useless answer,
    dressed up as a local result. That is the same failure as a fabricated
    court count: the interface claiming to know something it does not.

    So the panel has three states, and the distance to the nearest thing we
    publish decides which:

      within 100 miles   "Near Manila" — a real local answer
      100 to 400 miles   "Nothing verified near you", then the nearest we
                         do have, honestly labelled. A driver in Reno is
                         genuinely served by knowing Las Vegas is 400 miles
                         off; it is their call whether that is useful.
      beyond that        No distances at all. We say plainly that there is
                         nothing near them, name how far the nearest is,
                         and show the directory instead.

    A hundred miles is generous for "near" and deliberately so: it covers a
    metro area and its commuter belt, which is the radius a player might
    actually drive. Beyond four hundred, a distance is trivia.
  */
  var NEAR_MILES = 100
  var REACH_MILES = 400

  /* ---------------------------------------------------------
     Distance
     --------------------------------------------------------- */

  var EARTH_MILES = 3958.7613
  var RAD = Math.PI / 180

  /*
    Haversine. Great-circle, so it is honest at any separation, unlike the
    flat-earth approximation that is fine across a city and wrong across a
    state.
  */
  function milesBetween(aLat, aLng, bLat, bLng) {
    var dLat = (bLat - aLat) * RAD
    var dLng = (bLng - aLng) * RAD
    var s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(aLat * RAD) * Math.cos(bLat * RAD) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(s)))
  }

  /*
    A tenth of a mile is about 160 metres, which is a real distinction when
    you are choosing between two courts in the same neighbourhood. Past ten
    miles it is noise, so it rounds. Past a hundred nobody is driving for a
    game, so it rounds harder.
  */
  function milesText(d) {
    var n = d < 10 ? d.toFixed(1) : d < 100 ? String(Math.round(d)) : String(Math.round(d / 5) * 5)
    var unit = n === '1.0' || n === '1' ? ' mile' : ' miles'
    /* A thousands separator, because "6,640 miles" reads as a distance and
       "6640 miles" reads as a part number. */
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + unit
  }

  function formatMiles(d, approx) {
    return (approx ? 'about ' : '') + milesText(d) + ' away'
  }

  /* ---------------------------------------------------------
     Data, fetched once and only when somebody actually asks
     --------------------------------------------------------- */

  var indexPromise = null
  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL, {credentials: 'omit'})
        .then(function (r) { return r.ok ? r.json() : null })
        .catch(function () { return null })
    }
    return indexPromise
  }

  var wherePromise = null
  function loadWhere() {
    if (!wherePromise) {
      wherePromise = fetch(WHERE_URL, {credentials: 'omit'})
        .then(function (r) { return r.ok ? r.json() : null })
        .catch(function () { return null })
    }
    return wherePromise
  }

  /*
    The one piece of shared state: where we believe the visitor is. Held in
    a variable for the life of the page and nowhere else. Both search boxes
    on a page read the same one, so locating once locates both.
  */
  var place = null
  var placeError = null
  var panels = []

  function repaint() {
    panels.forEach(function (p) { p.render() })
  }

  function setPlace(next) {
    place = next
    placeError = null
    repaint()
  }

  function setPlaceError(message) {
    placeError = message
    repaint()
  }

  /*
    THE REGION IS ONLY A READABLE NAME INSIDE THE UNITED STATES.

    x-vercel-ip-country-region is a two-letter state code for a US address
    — "Seattle, WA" — and an ISO subdivision code everywhere else, which is
    often a number. Tested from a real address in the Philippines the
    header came back as "01", and the panel offered "Nothing verified near
    City of Candon, 01" to somebody who has never heard the region called
    that and could not have guessed what it meant.

    So the code is appended only where it is a name a reader recognises.
    Everywhere else the town stands on its own, which is all the sentence
    needed: it is naming where they are, not filing it.
  */
  var US_STATE_CODE = /^[A-Za-z]{2}$/

  /* IP tier. Coarse by nature, so it says so. */
  function locateByNetwork() {
    return loadWhere().then(function (w) {
      if (!w || !w.known || place) return
      var readableRegion =
        w.country === 'US' && w.region && US_STATE_CODE.test(w.region)
      var name = w.city
        ? w.city + (readableRegion ? ', ' + w.region : '')
        : 'your area'
      setPlace({lat: w.lat, lng: w.lng, label: name, approx: true})
    })
  }

  /*
    Precise tier. Never called without a click, or without a permission the
    browser already holds from a previous visit.
  */
  function locatePrecisely(onDone) {
    if (!navigator.geolocation) {
      setPlaceError('This browser cannot share a location.')
      if (onDone) onDone()
      return
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        setPlace({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'you',
          approx: false,
        })
        if (onDone) onDone()
      },
      function (err) {
        setPlaceError(
          err && err.code === 1
            ? 'Location permission was declined. Type a city or ZIP code instead.'
            : 'Could not read a location just now. Type a city or ZIP code instead.'
        )
        if (onDone) onDone()
      },
      {enableHighAccuracy: false, timeout: 10000, maximumAge: 300000}
    )
  }

  /*
    If the visitor said yes on an earlier visit, the browser remembers. Ask
    it, and upgrade silently: no prompt, and nothing we had to store to
    know it.
  */
  function upgradeIfAlreadyPermitted() {
    if (!navigator.permissions || !navigator.permissions.query) return
    try {
      navigator.permissions
        .query({name: 'geolocation'})
        .then(function (status) {
          if (status && status.state === 'granted') locatePrecisely()
        })
        .catch(function () {})
    } catch (e) {
      /* Some browsers throw on an unfamiliar permission name. Not fatal. */
    }
  }

  /* ---------------------------------------------------------
     Matching
     --------------------------------------------------------- */

  function normalise(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  }

  function rank(list, query) {
    var q = normalise(query)
    var tokens = q.split(' ').filter(Boolean)
    var out = []
    for (var i = 0; i < list.length; i++) {
      var e = list[i]
      var ok = true
      for (var t = 0; t < tokens.length; t++) {
        if (e.t.indexOf(tokens[t]) === -1) { ok = false; break }
      }
      if (!ok) continue
      var label = normalise(e.l)
      out.push({
        e: e,
        /*
          An exact name first, then one that starts with what was typed,
          then everything else. The same order /search/ uses on the server,
          so the dropdown and the results page agree about what is most
          relevant.
        */
        tier: label === q ? 0 : label.indexOf(q) === 0 ? 1 : 2,
        d: place ? milesBetween(place.lat, place.lng, e.y, e.x) : null
      })
    }
    out.sort(function (a, b) {
      if (a.tier !== b.tier) return a.tier - b.tier
      if (a.d !== null && b.d !== null && a.d !== b.d) return a.d - b.d
      return a.e.l.localeCompare(b.e.l)
    })
    return out
  }

  function nearest(list, limit) {
    if (!place) return []
    var out = list.map(function (e) {
      return {e: e, tier: 0, d: milesBetween(place.lat, place.lng, e.y, e.x)}
    })
    out.sort(function (a, b) { return a.d - b.d })
    return out.slice(0, limit)
  }

  /* ---------------------------------------------------------
     One panel per search form
     --------------------------------------------------------- */

  var uid = 0

  function attach(form) {
    var input = form.querySelector('input[name="q"]')
    if (!input) return

    var id = 'sg' + uid++
    var data = null
    var open = false
    var active = -1
    var options = []
    var started = false

    form.classList.add('has-suggest')

    var panel = document.createElement('div')
    panel.className = 'suggest'
    panel.id = id + '-panel'
    panel.hidden = true

    var head = document.createElement('div')
    head.className = 'suggest-head'

    var where = document.createElement('p')
    where.className = 'suggest-where'

    var locate = document.createElement('button')
    locate.type = 'button'
    locate.className = 'suggest-locate'

    head.appendChild(where)
    head.appendChild(locate)

    /*
      The live region is separate from the list. A screen reader is told
      "Near Seattle, 9 suggestions" once, rather than being read the whole
      list again on every keystroke.
    */
    var status = document.createElement('p')
    status.className = 'visually-hidden'
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')

    var list = document.createElement('div')
    list.className = 'suggest-list'
    list.id = id + '-list'
    list.setAttribute('role', 'listbox')
    list.setAttribute('aria-label', 'Nearby courts and places')

    var foot = document.createElement('p')
    foot.className = 'suggest-foot'

    panel.appendChild(head)
    panel.appendChild(status)
    panel.appendChild(list)
    panel.appendChild(foot)
    form.appendChild(panel)

    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-expanded', 'false')
    input.setAttribute('aria-controls', list.id)
    input.setAttribute('aria-autocomplete', 'list')
    input.setAttribute('autocomplete', 'off')

    function group(label) {
      var g = document.createElement('div')
      g.className = 'suggest-group'
      g.setAttribute('role', 'group')
      g.setAttribute('aria-label', label)
      var h = document.createElement('p')
      h.className = 'suggest-group-title'
      h.setAttribute('aria-hidden', 'true')
      h.textContent = label
      g.appendChild(h)
      return g
    }

    /*
      A pin for a place, a court for a court. Decorative: the label beside
      it says which is which, so both are hidden from assistive technology
      rather than announced as an image.
    */
    function icon(kind) {
      var ns = 'http://www.w3.org/2000/svg'
      var svg = document.createElementNS(ns, 'svg')
      svg.setAttribute('class', 'suggest-icon')
      svg.setAttribute('viewBox', '0 0 20 20')
      svg.setAttribute('width', '17')
      svg.setAttribute('height', '17')
      svg.setAttribute('aria-hidden', 'true')
      svg.setAttribute('focusable', 'false')
      svg.setAttribute('fill', 'none')
      svg.setAttribute('stroke', 'currentColor')
      svg.setAttribute('stroke-width', '1.6')
      svg.setAttribute('stroke-linecap', 'round')
      svg.setAttribute('stroke-linejoin', 'round')
      var d = document.createElementNS(ns, 'path')
      if (kind === 'court') {
        d.setAttribute('d', 'M3 4.5h14v11H3zM3 10h14M10 4.5v11')
      } else {
        d.setAttribute('d', 'M10 18s6-5.2 6-9.4A6 6 0 0 0 4 8.6C4 12.8 10 18 10 18z')
        var dot = document.createElementNS(ns, 'circle')
        dot.setAttribute('cx', '10')
        dot.setAttribute('cy', '8.4')
        dot.setAttribute('r', '2.1')
        svg.appendChild(dot)
      }
      svg.appendChild(d)
      return svg
    }

    function option(hit, kind) {
      var a = document.createElement('a')
      a.className = 'suggest-item'
      a.href = hit.e.h
      a.setAttribute('role', 'option')
      a.setAttribute('aria-selected', 'false')
      a.id = id + '-o' + options.length
      a.appendChild(icon(kind))

      var body = document.createElement('span')
      body.className = 'suggest-body'

      var name = document.createElement('span')
      name.className = 'suggest-name'
      name.textContent = hit.e.l

      var meta = document.createElement('span')
      meta.className = 'suggest-meta'
      /*
        Distance leads when there is one: it is the answer to the question
        the panel exists to ask. The venue count is the tiebreak, not the
        headline.
      */
      meta.textContent = hit.d === null
        ? hit.e.m
        : formatMiles(hit.d, place && place.approx) + ' · ' + hit.e.m

      body.appendChild(name)
      body.appendChild(meta)
      a.appendChild(body)
      options.push(a)
      return a
    }

    function setActive(i) {
      if (options[active]) {
        options[active].classList.remove('is-active')
        options[active].setAttribute('aria-selected', 'false')
      }
      active = i
      if (options[active]) {
        options[active].classList.add('is-active')
        options[active].setAttribute('aria-selected', 'true')
        input.setAttribute('aria-activedescendant', options[active].id)
        options[active].scrollIntoView({block: 'nearest'})
      } else {
        input.removeAttribute('aria-activedescendant')
      }
    }

    function render() {
      if (!open) return

      list.textContent = ''
      options = []
      active = -1
      input.removeAttribute('aria-activedescendant')

      var q = input.value.trim()

      /*
        Knowing where somebody is, and having something to show them, are
        two different questions. This answers the second one before a word
        of "near you" is printed. See NEAR_MILES above.
      */
      var closest = data && place ? nearest(data.places, 1)[0] : null
      var reach = closest ? closest.d : Infinity
      var coverage = !place || !data
        ? 'unknown'
        : reach <= NEAR_MILES ? 'near'
          : reach <= REACH_MILES ? 'far'
            : 'none'

      /* --- the head: where we think you are, and how to correct us --- */
      if (placeError) {
        where.textContent = placeError
        where.className = 'suggest-where is-note'
      } else if (coverage === 'near') {
        where.textContent = place.approx ? 'Near ' + place.label : 'Nearest to you'
        where.className = 'suggest-where'
      } else if (coverage === 'far' || coverage === 'none') {
        /*
          Said as plainly as it can be said. The alternative — a distance
          on a court six thousand miles away — is a sentence that is true
          and an answer that is a lie.
        */
        where.textContent = 'Nothing verified near ' + place.label
        where.className = 'suggest-where is-note'
      } else if (data) {
        where.textContent = 'Courts near you'
        where.className = 'suggest-where'
      } else {
        where.textContent = 'Looking…'
        where.className = 'suggest-where is-note'
      }

      /*
        The button offers the precise fix while we are on a network guess
        or on nothing at all, and disappears once there is a real position.
        A control that repeats what has already happened is clutter — and
        so is one that cannot help: pinning somebody's position to the
        metre does not move them closer to a country we do not cover yet.
      */
      locate.hidden =
        !navigator.geolocation || !!(place && !place.approx) || coverage === 'none'
      locate.textContent = place ? 'Use my exact location' : 'Find courts near me'

      if (!data) {
        foot.textContent = ''
        return
      }

      var cities = data.places.filter(function (e) { return e.k === 'city' })

      var placeHits
      var courtHits
      if (q) {
        placeHits = rank(data.places, q).slice(0, MAX_PLACES_TYPING)
        courtHits = rank(data.courts, q).slice(0, MAX_COURTS)
      } else if (coverage === 'near' || coverage === 'far') {
        placeHits = nearest(data.places, MAX_PLACES)
        courtHits = nearest(data.courts, MAX_COURTS)
      } else {
        /*
          Either we cannot place the visitor, or we can and there is
          nothing within reach of them. Both get the same answer: the
          cities, which is the honest fallback. A reader we cannot help
          locally is better served by seeing the whole coverage than by a
          list of distances that only says how far away we are.
        */
        placeHits = cities
          .slice(0, MAX_BROWSE)
          .map(function (e) { return {e: e, d: null} })
        courtHits = []
      }

      /*
        And when there IS a location and it is nowhere near us, say so in
        a sentence with the real number in it. "The nearest place we
        publish is about 6,640 miles away, in Seattle, WA" is a better
        answer than any list, because it tells a reader in Manila the one
        thing they need to know: not yet, and not close.
      */
      if (coverage === 'none' && !q && closest) {
        var note = document.createElement('p')
        note.className = 'suggest-none'
        note.textContent =
          'The nearest place we publish is ' + milesText(reach) + ' away, in ' +
          closest.e.l + '. This directory covers ' + cities.length +
          ' cities in the United States so far.'
        list.appendChild(note)
      }

      if (placeHits.length) {
        var placeTitle = q || coverage === 'near' ? 'Places'
          : coverage === 'far' ? 'Nearest to you'
            : 'Cities we publish'
        var g1 = group(placeTitle)
        placeHits.forEach(function (hit) { g1.appendChild(option(hit, 'place')) })
        list.appendChild(g1)
      }
      if (courtHits.length) {
        var g2 = group(!q && coverage === 'far' ? 'Nearest courts' : 'Courts')
        courtHits.forEach(function (hit) { g2.appendChild(option(hit, 'court')) })
        list.appendChild(g2)
      }

      if (!placeHits.length && !courtHits.length) {
        var none = document.createElement('p')
        none.className = 'suggest-none'
        none.textContent = q
          ? 'Nothing published matches “' + q + '”. Press Enter to see everything we do publish.'
          : 'Nothing to suggest yet.'
        list.appendChild(none)
      }

      foot.textContent = q
        ? 'Press Enter for the full results page.'
        : 'Every court here is verified against a named source.'

      status.textContent =
        (place ? where.textContent + '. ' : '') +
        options.length +
        (options.length === 1 ? ' suggestion' : ' suggestions') +
        '.'
    }

    function show() {
      if (!open) {
        open = true
        panel.hidden = false
        input.setAttribute('aria-expanded', 'true')
      }
      render()
    }

    function hide() {
      if (!open) return
      setActive(-1)
      open = false
      panel.hidden = true
      input.setAttribute('aria-expanded', 'false')
      input.removeAttribute('aria-activedescendant')
    }

    /*
      The work starts on the first focus and never again. Nothing is
      fetched at all for a visitor who never uses the search box, which is
      most of them.
    */
    function start() {
      if (started) return
      started = true
      loadIndex().then(function (doc) {
        data = doc
        render()
      })
      locateByNetwork().then(function () { upgradeIfAlreadyPermitted() })
    }

    input.addEventListener('focus', function () { start(); show() })
    input.addEventListener('click', function () { start(); show() })
    input.addEventListener('input', function () { start(); show() })

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (open) { e.stopPropagation(); hide() }
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!open) { start(); show() }
        if (!options.length) return
        e.preventDefault()
        setActive(
          e.key === 'ArrowDown'
            ? (active + 1) % options.length
            : (active <= 0 ? options.length : active) - 1
        )
        return
      }
      if (e.key === 'Enter' && open && options[active]) {
        /*
          A highlighted suggestion is a destination, so go there. With
          nothing highlighted the form submits to /search/ exactly as it
          does with this script absent.
        */
        e.preventDefault()
        window.location.href = options[active].href
      }
    })

    /*
      Keep focus in the input while the pointer is inside the panel, so the
      field does not blur and close the very thing being clicked. The
      anchors still receive their click.
    */
    panel.addEventListener('mousedown', function (e) {
      if (e.target === locate || locate.contains(e.target)) return
      e.preventDefault()
    })

    locate.addEventListener('click', function () {
      var before = locate.textContent
      locate.disabled = true
      locate.textContent = 'Locating…'
      locatePrecisely(function () {
        locate.disabled = false
        locate.textContent = before
        render()
      })
    })

    form.addEventListener('focusout', function (e) {
      if (e.relatedTarget && form.contains(e.relatedTarget)) return
      hide()
    })

    document.addEventListener('click', function (e) {
      if (!form.contains(e.target)) hide()
    })

    panels.push({render: render})
  }

  Array.prototype.forEach.call(forms, attach)
})()
