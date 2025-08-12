  function WindowLoaded() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  function LoadData() {
    const decomp = new DecompressionStream("gzip");
    const writer = decomp.writable.getWriter();
    let raw_data = document.getElementById('compressed-data').innerText.replace("\n", "");
    let raw = Uint8Array.from(atob(raw_data), c => c.charCodeAt(0));
    writer.write(raw);
    writer.close();

    let txt = new Response(decomp.readable).arrayBuffer();

    return txt.then(function (buf) {
    	return new TextDecoder().decode(buf);
    });
  }

  function GetData() {
    return WindowLoaded().then(function() { return LoadData().then(function(dt) { let v = JSON.parse(dt); return v; })});
  }

  const data = GetData();

  function GetHeaders() {
    let ret = []
    let headings = ['Seed', 'Breakthroughs', 'Sobrius Map', 'Sobrius Start', 'Desertum Map', 'Desertum Start', 'Saltu Map', 'Saltu Start'];
    let hidden_headings = ['Handle', 'Map-Start-Concat'];
    let regions = ['Sobrius', 'Desertum', 'Saltu'];
    regions.forEach(function(region) {
      hidden_headings.forEach(function (x) {
        let h = region + ' ' + x;
        headings.push(h);
      });
    });
    headings.forEach(function (x) { ret.push({'title': x}); });
    return ret;
  }

  function MapStartConcat(mp, st) {
    return mp + "--" + st;
  }

  function MakeRow(
      seed, breakthroughs,
      sobrius_map, sobrius_start, sobrius_handle,
      desertum_map, desertum_start, desertum_handle,
      saltu_map, saltu_start, saltu_handle) {

    let vals = [seed, breakthroughs.join(', '), sobrius_map, sobrius_start, desertum_map, desertum_start, saltu_map, saltu_start];
    let hidden_vals = [sobrius_handle, MapStartConcat(sobrius_map, sobrius_start),
                       desertum_handle, MapStartConcat(desertum_map, desertum_start),
                       saltu_handle, MapStartConcat(saltu_map, saltu_start)];

    vals.push(...hidden_vals);
    return vals;
  }

  function breakthroughs(techs, lookup) {
    return techs.map(lookup);
  }

  function make_lookup(data) {
    return function(v) { return data.strings[v]; }
  }

  function make_handle_lookup(data) {
    return function(entry) {
      return data.handles[entry.mp][entry.st];
    };
  }

  function RenderData(dt) {
    let lookup = make_lookup(dt);
    let handle = make_handle_lookup(dt);
    let ret = [];
    dt.data.forEach(function(row) {
      ret.push(MakeRow(
             row.seed, breakthroughs(row.techs, lookup),
             lookup(row.sobrius.mp), row.sobrius.st, handle(row.sobrius),
             lookup(row.desert.mp), row.desert.st, handle(row.desert),
             lookup(row.saltu.mp), row.saltu.st, handle(row.saltu)));
    });
    return ret;
  }

  function AddTable() {
    return data.then(function (dt) {
       let table = document.createElement('table');
       document.getElementById("main").appendChild(table);

       let headers = GetHeaders();
       let rendered_data = RenderData(dt);
       return new DataTable(table, {
          columns: headers,
          data: rendered_data,
          columnDefs: [
            {
                target: [8, 9, 10, 11, 12, 13],
                visible: false,
                searchable: true
            },
          ],
          pageLength: 1000,
          lengthMenu: [1000, 5000, 100, -1]
      });
    });
  }

  function AddBulletedList(items, parent) {
    let sitems = items.values().toArray().toSorted();
    let ul = document.createElement('ul');
    sitems.forEach(function (x) {
      let li = document.createElement('li');
      li.innerText = x;
      ul.appendChild(li);
    });
    parent.appendChild(ul);
  }

  function MakeLegendBox(title, items, parent) {
    let s = document.createElement('span');
    s.classList.add('legend-subsection');
    let t = document.createElement('h2');
    t.innerText = title;
    s.appendChild(t);
    AddBulletedList(items, s);
    parent.appendChild(s);
  }

  function UpdateMapLegendData(map_set, map_max_map, map, spawn, lookup) {
    let name = lookup(map);
    map_set.add(name);
    if (!map_max_map.has(name)) {
        map_max_map.set(name, -1);
    }
    map_max_map.set(name, Math.max(map_max_map.get(name), spawn));
  }

  function JoinMaxesAndList(maps, map_maxes) {
    let ret = new Set();
    maps.forEach(function(mp) {
      ret.add(mp + " (1 - " + map_maxes.get(mp) + ")")
    });
    return ret;
  }

  function AddLegend() {
    return data.then(function(dt) {
      let legend_box = document.getElementById("legend");
      let so_maps = new Set();
      let so_map_maxes = new Map();
      let sa_maps = new Set();
      let sa_map_maxes = new Map();
      let de_maps = new Set();
      let de_map_maxes = new Map();
      let techs = new Set();
      let lookup = make_lookup(dt);
      dt.data.forEach(function(row) {
        breakthroughs(row.techs, lookup).forEach(function(t) { techs.add(t); });
        UpdateMapLegendData(so_maps, so_map_maxes, row.sobrius.mp, row.sobrius.st, lookup);
        UpdateMapLegendData(sa_maps, sa_map_maxes, row.saltu.mp, row.saltu.st, lookup);
        UpdateMapLegendData(de_maps, de_map_maxes, row.desert.mp, row.desert.st, lookup);
      });
      MakeLegendBox("Breakthroughs", techs, legend_box);
      MakeLegendBox("Sobrius Maps", JoinMaxesAndList(so_maps, so_map_maxes), legend_box);
      MakeLegendBox("Desertum Maps", JoinMaxesAndList(de_maps, de_map_maxes), legend_box);
      MakeLegendBox("Saltu Maps", JoinMaxesAndList(sa_maps, sa_map_maxes), legend_box);
    });
  }

  function MaybeSetSearch(datatable) {
    const params_str = window.location.search;
    const params = new URLSearchParams(params_str);
    if (!params.has('q')) {
      return;
    }
    dt.then(function(v) { v.search(params.get('q')).draw(); });
  }

