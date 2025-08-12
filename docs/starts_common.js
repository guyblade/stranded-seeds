const soil_types = ['none', 'loam', 'silt', 'clay', 'sand', 'gravel'];
const ranges = [10, 25, 50, 100];

//  {"radius": 10, "none": 0.0, "loam": 78.912, "silt": 20.181, "clay": 0.0, "sand": 0.0, "gravel": 0.907},
function AddHeaders(parent) {
  let titles = ['Image', 'Map', 'Start', 'Handle'];
  let farms = soil_types.map(function(x) { return x[0].toLocaleUpperCase() + x.substr(1) + " %";});
  ranges.forEach(function (range) {
    farms.forEach(function (soil) {
      let t = '±' + range + "\n" + soil;
      titles.push(t);
    });
  });
  let tr = document.createElement('tr');
  parent.appendChild(tr)
  titles.forEach(function(x) {
    let th = document.createElement('th');
    th.innerText = x;
    tr.appendChild(th);
  });
}

function MakeImg(url) {
  let im = document.createElement('img');
  im.setAttribute('data-src', url);
  im.classList.add('inline-img');
  return im;
}

function InvertClass(elem, cls) {
  if (elem.classList.contains(cls)) {
    elem.classList.remove(cls);
  } else {
    elem.classList.add(cls);
  }
}

function MakeImageToggle(a, img) {
  return function() {
    if (!img.hasAttribute('src')) {
      img.setAttribute('src', img.getAttribute('data-src'));
    }
    InvertClass(a, 'invisible');
    InvertClass(img, 'invisible');
  };
}

function ToGithubImageUrl(url) {
  // https://github.com/guyblade/stranded-seeds/tree/main/full_size_screenshots/desertum
  // "desertum_starts/images/Survey-Desert_Canyon_01-1-1178241089-113722.png"

  const prefix = "https://github.com/guyblade/stranded-seeds/tree/main/full_size_screenshots/";
  return prefix + url.replace("_starts/images", "");
}

function MakeA(url, text, new_window) {
  let a = document.createElement('a');
  a.setAttribute('href', url);
  if (new_window) {
    a.setAttribute('target', '_blank');
  }
  a.innerText = text;
  return a;
}

function AppendImageCell(dt, parent_row) {
  let im = document.createElement('td');
  let url = dt['image_src']
  let a = MakeA(url, 'View in New Tab', true);

  let br = document.createElement('br');
  im.appendChild(br);
  let i = MakeImg(url)
  i.classList.add('invisible');
  let a2 = document.createElement('a');
  a2.onclick = MakeImageToggle(a2, i);
  a2.setAttribute('href', 'javascript: false');
  i.onclick = MakeImageToggle(a2, i);
  a2.innerText = 'Display Here';

  let a3 = MakeA(ToGithubImageUrl(url), 'View Full Size on Github', true);

  im.appendChild(a2);
  im.appendChild(i);
  im.appendChild(document.createElement('br'));
  im.appendChild(a);
  im.appendChild(document.createElement('br'));
  im.appendChild(a3);

  parent_row.appendChild(im);
}

function AppendTextCell(text, parent_row) {
  let td = document.createElement('td');
  td.innerText = text;
  parent_row.appendChild(td);
}

function AppendHandleCell(handle, parent_row) {
  let td = document.createElement('td');
  let a = MakeA("seeds.html?q=" + handle, handle, true);
  let a2 = MakeA("seeds_3m.html?q=" + handle, "3m", true);

  td.appendChild(a);
  td.appendChild(document.createTextNode(" ["));
  td.appendChild(a2)
  td.appendChild(document.createTextNode("]"));
  parent_row.appendChild(td);
}


function AddData(parent, data) {
  Object.keys(data).forEach(function (map) {
    let starts = Object.keys(data[map]).map(function (x) { return  parseInt(x); });
    starts.sort();
    starts.forEach(function(start) {
      let dt = data[map][start];
      let tr = document.createElement('tr');
      parent.appendChild(tr);
      AppendImageCell(dt, tr);
      AppendTextCell(map, tr);
      AppendTextCell(start, tr);
      AppendHandleCell(dt['handle'], tr);
      ranges.forEach(function(range) {
        soil_types.forEach(function(soil) {
      AppendTextCell(dt[range][soil], tr);
    });
      });
    });
  });
}

function AddTable(data) {
  let t = document.createElement('table');
  let th = document.createElement('thead');
  t.appendChild(th);
  AddHeaders(th);
  let tb = document.createElement('tbody');
  t.appendChild(tb);
  AddData(tb, data);
  document.getElementById('main').appendChild(t);
  return new DataTable(t, {
        columnDefs: [
          {
              target: 0,
              searchable: false
          },
        ],
        order: [[1, 'asc'], [2, 'asc']],
        pageLength: 1000,
        lengthMenu: [1000, 5000, 100, -1]
    });

}

