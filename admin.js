// ════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════
var ADMIN_PASSWORD = 'iPre-Order GH 2025';
var SESSION_KEY    = 'ipreAdminSession';

// ════════════════════════════════════════════════
//  🔥 FIREBASE — paste your project values here
// ════════════════════════════════════════════════
var firebaseConfig = {
  apiKey:            "AIzaSyAWFzvyTYB1uh0CVrsMuhi1rpF2GHEc-ks",
  authDomain:        "ipreorders-gh.firebaseapp.com",
  projectId:         "ipreorders-gh",
  storageBucket:     "ipreorders-gh.firebasestorage.app",
  messagingSenderId: "711983030667",
  appId:             "1:711983030667:web:a48ddb75946070ea1acf8e"
};
firebase.initializeApp(firebaseConfig);
var _db = firebase.firestore();
var _imgCol = _db.collection('phone-images'); // one doc per phone, avoids 1MB Firestore limit

// ════════════════════════════════════════════════
//  STORE — Firestore-backed, fire-and-forget writes
//  One Firestore doc: collection "site", doc "data"
// ════════════════════════════════════════════════
var _cache = {};
var STORE = {
  // Call once at startup (inside an async fn) to fill _cache
  loadAll: function(defaults) {
    return _db.collection('site').doc('data').get().then(function(snap) {
      if (snap.exists) {
        _cache = snap.data();
      } else {
        _cache = defaults;
        _db.collection('site').doc('data').set(defaults, { merge: true }); // seed first run
      }
    }).catch(function() { _cache = defaults; });
  },
  // Sync read from cache
  get: function(k, def) {
    return _cache[k] !== undefined ? _cache[k] : def;
  },
  // Sync-feeling write: update cache immediately, push to Firestore in background
  set: function(k, v) {
    _cache[k] = v;
    var update = {};
    update[k] = v;
    _db.collection('site').doc('data').set(update, { merge: true }).catch(function(e) {
      console.error('Firestore write error:', e);
    });
  }
};

// ════════════════════════════════════════════════
//  LOGIN / LOGOUT
// ════════════════════════════════════════════════
function doLogin() {
  var pwd = document.getElementById('pwdInput').value;
  if (pwd === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').classList.add('visible');
    initApp();
  } else {
    var err = document.getElementById('loginErr');
    err.classList.add('show');
    var card = document.getElementById('loginCard');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    document.getElementById('pwdInput').value = '';
    document.getElementById('pwdInput').focus();
    setTimeout(function(){ err.classList.remove('show'); }, 3000);
  }
}

function doLogout() {
  if (!confirm('Log out of admin?')) return;
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('app').classList.remove('visible');
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('pwdInput').value = '';
}

// Auto-check session on load
window.addEventListener('DOMContentLoaded', function() {
  if (sessionStorage.getItem(SESSION_KEY)) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').classList.add('visible');
    initApp();
  }
  document.getElementById('pwdInput').focus();
});

// ════════════════════════════════════════════════
//  DATA LOADERS
// ════════════════════════════════════════════════
var DEFAULT_PHONES = [
  { id:'ip16',    name:'iPhone 16',         series:'iPhone 16',     locked:9500,  unlocked:11500 },
  { id:'ip16p',   name:'iPhone 16 Pro',     series:'iPhone 16 Pro', locked:13800, unlocked:16000 },
  { id:'ip16pm',  name:'iPhone 16 Pro Max', series:'iPhone 16 Pro', locked:15500, unlocked:18000 },
  { id:'ip17',    name:'iPhone 17',         series:'iPhone 17',     locked:10800, unlocked:13000 },
  { id:'ip17air', name:'iPhone 17 Air',     series:'iPhone 17',     locked:12200, unlocked:14500 },
  { id:'ip17p',   name:'iPhone 17 Pro',     series:'iPhone 17 Pro', locked:15000, unlocked:17500 },
  { id:'ip17pm',  name:'iPhone 17 Pro Max', series:'iPhone 17 Pro', locked:17000, unlocked:20000 },
  { id:'ip17e',   name:'iPhone 17e',        series:'iPhone 17',     locked:8000,  unlocked:11000 }
];
var DEFAULT_CONTENT = {
  heroTitle: 'Your Next iPhone, At a Price You\'ll Love.',
  heroSub: 'Brand new, sealed in box with all accessories. Locked & Unlocked options. Delivered to your door in Ghana.',
  whatsapp: '233206241853',
  airTime: '3–4 Weeks',
  shipTime: '45–60 Days'
};
var DEFAULT_TESTIMONIALS = [
  { name:'Kofi Mensah', model:'iPhone 16 Pro Max', stars:5, text:'Got my phone in 3 weeks, completely sealed. Excellent service!' },
  { name:'Ama Asante',  model:'iPhone 16',         stars:5, text:'Very affordable prices. Would recommend to anyone.' },
  { name:'Kweku Boateng',model:'iPhone 17 Pro',    stars:5, text:'Trusted seller, fast updates on shipping. Love it.' }
];
var DEFAULT_FAQS = [
  { q:'Are the phones brand new?',      a:'Yes, all phones are brand new, sealed in original Apple packaging with all accessories.' },
  { q:'How do I pay?',                  a:'We accept MTN MoMo, Telecel Cash, and Visa/Mastercard. A 60% deposit secures your pre-order.' },
  { q:'How long does delivery take?',   a:'Air freight takes 3–4 weeks. Sea freight takes 45–60 days.' },
  { q:'Can I get an unlocked phone?',   a:'Yes! We offer both locked (US carrier) and unlocked versions.' }
];
var DEFAULT_MOMO = {
  'MTN MoMo':     { num:'+233 24 687 3140', name:'Philip Darko' },
  'Telecel Cash': { num:'+233 20 624 1853', name:'Philip Darko' }
};
var DEFAULT_STORAGE = {
  '16':  ['128GB','256GB','512GB','1TB'],
  '17':  ['256GB','512GB','1TB'],
  'pro': ['256GB','512GB','1TB'],
  'air': ['128GB','256GB','512GB'],
  'e':   ['128GB','256GB']
};
var DEFAULT_TRUST = [
  'New & Sealed in Box',
  'All Accessories Included',
  'Locked & Unlocked Available',
  'iPhone 16 & 17 Series',
  'Air or Ship Delivery',
  'Trusted by 200+ Customers'
];

function loadData() {
  return {
    phones:        STORE.get('phones',        DEFAULT_PHONES),
    orders:        STORE.get('orders',        []),
    content:       STORE.get('content',       DEFAULT_CONTENT),
    testimonials:  STORE.get('testimonials',  DEFAULT_TESTIMONIALS),
    faqs:          STORE.get('faqs',          DEFAULT_FAQS),
    momoNums:      STORE.get('momoNums',      DEFAULT_MOMO),
    inventory:     STORE.get('inventory',     {}),
    storageOptions:STORE.get('storageOptions',DEFAULT_STORAGE),
    trustItems:    STORE.get('trustItems',    DEFAULT_TRUST),
    imgOverrides:  STORE.get('imgOverrides',  {}),
    notifSettings: STORE.get('notifSettings', { email:'', neworder:true, status:true, stock:false, daily:false, waReply:'' })
  };
}

// ════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════
var D = {}; // global data

function initApp() {
  var defaults = {
    phones: DEFAULT_PHONES, orders: [], content: DEFAULT_CONTENT,
    testimonials: DEFAULT_TESTIMONIALS, faqs: DEFAULT_FAQS,
    momoNums: DEFAULT_MOMO, inventory: {}, storageOptions: DEFAULT_STORAGE,
    trustItems: DEFAULT_TRUST, imgOverrides: {},
    notifSettings: { email:'', neworder:true, status:true, stock:false, daily:false, waReply:'' }
  };
  document.getElementById('topbarTitle').textContent = 'Loading…';
  STORE.loadAll(defaults).then(function() {
    D = loadData();
    renderOverview();
    renderContentPanel();
    renderNotifPanel();

    // Responsive two-col
    var twoCol = document.querySelectorAll('.dash-two-col');
    function checkLayout() {
      twoCol.forEach(function(el) {
        el.style.gridTemplateColumns = window.innerWidth < 640 ? '1fr' : '1fr 1fr';
      });
    }
    checkLayout();
    window.addEventListener('resize', checkLayout);
  }).catch(function(err) {
    console.error('Firebase load error:', err);
    // Fall back to rendering with defaults so dashboard isn't blank
    D = loadData();
    renderOverview();
    renderContentPanel();
    renderNotifPanel();
  }); // end STORE.loadAll
}

// ════════════════════════════════════════════════
//  PANEL ROUTING
// ════════════════════════════════════════════════
var PANEL_META = {
  overview:      { title:'Overview',             badge:'Dashboard'   },
  orders:        { title:'Orders',               badge:'Management'  },
  products:      { title:'Products',             badge:'Catalogue'   },
  customers:     { title:'Customers',            badge:'CRM'         },
  inventory:     { title:'Inventory',            badge:'Stock'       },
  sales:         { title:'Sales & Revenue',      badge:'Finance'     },
  phoneimages:   { title:'Phone Photos',         badge:'Media'       },
  storage:       { title:'Storage Options',      badge:'Checkout'    },
  trustbar:      { title:'Trust Bar',            badge:'Site'        },
  content:       { title:'Site Content',         badge:'CMS'         },
  notifications: { title:'Notifications',        badge:'Settings'    }
};

function showPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(b){ b.classList.remove('active'); });
  var panel = document.getElementById('panel' + id.charAt(0).toUpperCase() + id.slice(1));
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
  else {
    // find the matching nav item by panel id in onclick
    document.querySelectorAll('.nav-item').forEach(function(b){
      if (b.getAttribute('onclick') && b.getAttribute('onclick').indexOf("'"+id+"'") !== -1) b.classList.add('active');
    });
  }
  var meta = PANEL_META[id] || { title:id, badge:'' };
  document.getElementById('topbarTitle').textContent = meta.title;
  document.getElementById('topbarBadge').textContent = meta.badge;
  // Lazy render
  if (id === 'orders')    renderOrdersTable();
  if (id === 'products')  { renderProductsTable(); renderPriceEditor(); }
  if (id === 'customers') renderCustomersTable();
  if (id === 'inventory') renderInventoryEditor();
  if (id === 'sales')     renderSalesPanel();
  if (id === 'phoneimages') renderPhoneImagesEditor();
  if (id === 'storage')   renderStorageEditor();
  if (id === 'trustbar')  renderTrustEditor();
  closeSidebar();
}

// ════════════════════════════════════════════════
//  OVERVIEW
// ════════════════════════════════════════════════
function renderOverview() {
  D = loadData();
  var orders = D.orders;
  var total   = orders.length;
  var revenue = orders.reduce(function(s,o){ return s+(o.price||0); },0);
  var pending = orders.filter(function(o){ return o.status==='Pending'; }).length;
  var shipped = orders.filter(function(o){ return o.status==='Shipped'||o.status==='Delivered'; }).length;
  var today   = orders.filter(function(o){ return o.date === todayStr(); }).length;

  document.getElementById('overviewStats').innerHTML =
    statCard('Total Orders',     total,                       'All time',             '') +
    statCard('Revenue',          'GH₵ '+revenue.toLocaleString(), 'Total collected',  '') +
    statCard('Pending',          pending,                     'Awaiting action',      pending > 0 ? 'warn':'') +
    statCard('Shipped / Done',   shipped,                     'Fulfilled',            '') +
    statCard('Orders Today',     today,                       todayStr(),             '');

  // Revenue by phone bar chart
  var modelRevMap = {};
  orders.forEach(function(o){
    var m = (o.phone||'Unknown').split('(')[0].trim();
    modelRevMap[m] = (modelRevMap[m]||0) + (o.price||0);
  });
  var sorted = Object.entries(modelRevMap).sort(function(a,b){ return b[1]-a[1]; }).slice(0,6);
  var maxRev = sorted.length ? sorted[0][1] : 1;
  document.getElementById('revenueChart').innerHTML = sorted.length
    ? sorted.map(function(e){ return barRow(e[0], e[1], maxRev, 'GH₵ '+e[1].toLocaleString()); }).join('')
    : '<p style="color:var(--muted);font-size:.82rem;">No orders yet.</p>';

  // Status rings
  var statuses = ['Pending','Confirmed','Processing','Shipped','Delivered'];
  var statusColors = { Pending:'#f5a623', Confirmed:'#40b3ff', Processing:'#a78bfa', Shipped:'#30d158', Delivered:'#30d158' };
  var rings = statuses.map(function(s){
    var cnt = orders.filter(function(o){ return o.status===s; }).length;
    var pct = total ? Math.round(cnt/total*100) : 0;
    return '<div class="ring-item">' +
      ringSVG(pct, statusColors[s]) +
      '<div class="ring-label">' + s + '</div>' +
      '<div class="ring-val">' + cnt + '</div>' +
    '</div>';
  });
  document.getElementById('statusRings').innerHTML = rings.join('');

  // Recent orders table
  renderTableInto('recentOrdersTable', orders.slice(0,8), true);
}

function statCard(label, val, sub, subClass) {
  return '<div class="stat-card">' +
    '<div class="stat-label">' + label + '</div>' +
    '<div class="stat-value">' + val + '</div>' +
    '<div class="stat-sub ' + subClass + '">' + sub + '</div>' +
  '</div>';
}
function barRow(label, val, max, displayVal) {
  var pct = max ? Math.round(val/max*100) : 0;
  return '<div class="chart-row">' +
    '<div class="chart-label" title="'+label+'">' + label + '</div>' +
    '<div class="chart-track"><div class="chart-fill" style="width:'+pct+'%"></div></div>' +
    '<div class="chart-val">' + displayVal + '</div>' +
  '</div>';
}
function ringSVG(pct, color) {
  var r = 22; var circ = 2*Math.PI*r;
  var dash = (pct/100)*circ;
  return '<svg width="56" height="56" viewBox="0 0 56 56">' +
    '<circle cx="28" cy="28" r="'+r+'" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="5"/>' +
    '<circle cx="28" cy="28" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="5"' +
      ' stroke-dasharray="'+dash+' '+circ+'" stroke-dashoffset="'+circ/4+'"' +
      ' stroke-linecap="round" style="transition:stroke-dasharray .8s cubic-bezier(0.22,1,0.36,1)"/>' +
    '<text x="28" y="33" text-anchor="middle" font-size="11" font-weight="700" fill="'+color+'" font-family="Manrope,sans-serif">'+pct+'%</text>' +
  '</svg>';
}

// ════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════
function renderOrdersTable() {
  D = loadData();
  var filter = (document.getElementById('orderFilter')||{}).value || '';
  var list = filter ? D.orders.filter(function(o){ return o.status===filter; }) : D.orders;
  renderTableInto('allOrdersTable', list, false);
}

function renderTableInto(tableId, list, mini) {
  var t = document.getElementById(tableId); if (!t) return;
  if (!list.length) {
    t.innerHTML = '<thead><tr><th colspan="8">No orders found</th></tr></thead><tbody></tbody>';
    return;
  }
  var h = '<thead><tr>' +
    '<th>Order ID</th><th>Customer</th><th>Phone / Storage</th>' +
    '<th>Total</th><th>Date</th>' + (mini ? '' : '<th>Address</th>') +
    '<th>Payment</th><th>Status</th>' + (mini ? '' : '<th>Actions</th>') +
  '</tr></thead>';

  var stages = ['60% Deposit','40% Balance','Fully Paid'];
  var statuses = ['Pending','Confirmed','Processing','Shipped','Delivered'];
  var rows = list.map(function(o){
    var idx = D.orders.indexOf(o);
    var pStage = o.paidStage || '60% Deposit';
    var pCls = pStage==='Fully Paid' ? 'badge-paid-ful' : pStage==='40% Balance' ? 'badge-paid-bal' : 'badge-paid-dep';
    var sCls = { Pending:'badge-pending',Confirmed:'badge-confirm',Processing:'badge-process',Shipped:'badge-shipped',Delivered:'badge-deliver' }[o.status] || 'badge-pending';
    var stOpts = statuses.map(function(s){ return '<option'+(s===o.status?' selected':'')+'>'+s+'</option>'; }).join('');
    var pgOpts = stages.map(function(s){ return '<option'+(s===pStage?' selected':'')+'>'+s+'</option>'; }).join('');
    return '<tr>' +
      '<td><span class="td-strong">' + esc(o.id) + '</span></td>' +
      '<td>' + esc(o.name) + '<div class="td-muted">' + esc(o.contact||o.phone2||'') + '</div></td>' +
      '<td>' + esc(o.phone||'') + '<div class="td-muted">' + esc(o.storage||'') + '</div></td>' +
      '<td style="color:var(--green);font-weight:700;">GH₵ ' + (o.price||0).toLocaleString() + '</td>' +
      '<td style="color:var(--muted);">' + (o.date||'') + '</td>' +
      (mini ? '' : '<td style="font-size:.75rem;color:var(--muted);">' + esc(o.address||'—') + '</td>') +
      '<td><span class="badge '+pCls+'">' + pStage + '</span>' +
        (mini ? '' : '<br><select class="a-select" style="margin-top:4px;font-size:.72rem;" onchange="updatePaidStage('+idx+',this.value)">'+pgOpts+'</select>') +
      '</td>' +
      '<td><span class="badge '+sCls+'">' + esc(o.status) + '</span>' +
        (mini ? '' : '<br><select class="a-select" style="margin-top:4px;font-size:.72rem;" onchange="updateStatus('+idx+',this.value)">'+stOpts+'</select>') +
      '</td>' +
      (mini ? '' : '<td><button class="btn btn-red btn-sm" onclick="deleteOrder('+idx+')">Delete</button></td>') +
    '</tr>';
  }).join('');
  t.innerHTML = h + '<tbody>' + rows + '</tbody>';
}

function updateStatus(idx, val) {
  D.orders[idx].status = val; STORE.set('orders', D.orders);
  notify('Status updated → ' + val, 'success');
}
function updatePaidStage(idx, val) {
  D.orders[idx].paidStage = val; STORE.set('orders', D.orders);
  notify('Payment stage updated', 'success');
}
function deleteOrder(idx) {
  if (!confirm('Delete order ' + D.orders[idx].id + '?')) return;
  D.orders.splice(idx,1); STORE.set('orders', D.orders);
  renderOrdersTable(); renderOverview();
  notify('Order deleted', 'success');
}

// Add Manual Order
function openAddOrderModal() { openModal('addOrderModal'); }
function saveManualOrder() {
  D = loadData();
  var name = document.getElementById('mo_name').value.trim();
  var phone2= document.getElementById('mo_phone').value.trim();
  if (!name || !phone2) { notify('Name and phone are required', 'error'); return; }
  var newOrder = {
    id:      'iPre-Manual-' + (D.orders.length+1).toString().padStart(4,'0'),
    name:    name,
    contact: phone2,
    email:   document.getElementById('mo_email').value.trim(),
    phone:   document.getElementById('mo_model').value.trim(),
    storage: document.getElementById('mo_storage').value.trim(),
    price:   parseInt(document.getElementById('mo_price').value)||0,
    status:  document.getElementById('mo_status').value,
    paidStage: document.getElementById('mo_paidStage').value,
    address: document.getElementById('mo_addr').value.trim(),
    date:    todayStr(),
    method:  'Manual'
  };
  D.orders.unshift(newOrder); STORE.set('orders', D.orders);
  closeModal('addOrderModal');
  renderOrdersTable(); renderOverview();
  notify('Order added successfully', 'success');
}

// ════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════
function renderProductsTable() {
  D = loadData();
  var t = document.getElementById('productsTable'); if (!t) return;
  var inv = D.inventory;
  var h = '<thead><tr><th>ID</th><th>Product</th><th>Series</th><th>Locked (GH₵)</th><th>Unlocked (GH₵)</th><th>Stock</th><th>Actions</th></tr></thead>';
  var rows = D.phones.map(function(p,i){
    var stock = inv[p.id] !== undefined ? inv[p.id] : '—';
    var stockCls = stock === '—' ? '' : stock > 5 ? 'badge-in-stock' : stock > 0 ? 'badge-low' : 'badge-out';
    return '<tr>' +
      '<td style="color:var(--muted);font-size:.72rem;">' + esc(p.id) + '</td>' +
      '<td class="td-strong">' + esc(p.name) + '</td>' +
      '<td>' + esc(p.series) + '</td>' +
      '<td>GH₵ ' + (p.locked||0).toLocaleString() + '</td>' +
      '<td>GH₵ ' + (p.unlocked||0).toLocaleString() + '</td>' +
      '<td>' + (stock!=='—' ? '<span class="badge '+stockCls+'">'+stock+'</span>' : '—') + '</td>' +
      '<td><button class="btn btn-red btn-sm" onclick="deleteProduct('+i+')">Delete</button></td>' +
    '</tr>';
  }).join('');
  t.innerHTML = h + '<tbody>' + rows + '</tbody>';
}

function deleteProduct(idx) {
  if (!confirm('Remove product "' + D.phones[idx].name + '"?')) return;
  D.phones.splice(idx,1); STORE.set('phones', D.phones);
  renderProductsTable(); renderPriceEditor();
  notify('Product removed', 'success');
}

function openAddProductModal() { openModal('addProductModal'); }
function saveNewProduct() {
  D = loadData();
  var name = document.getElementById('np_name').value.trim();
  if (!name) { notify('Product name is required','error'); return; }
  var p = {
    id:       name.toLowerCase().replace(/[^a-z0-9]/g,''),
    name:     name,
    series:   document.getElementById('np_series').value.trim(),
    locked:   parseInt(document.getElementById('np_locked').value)||0,
    unlocked: parseInt(document.getElementById('np_unlocked').value)||0
  };
  var stock = parseInt(document.getElementById('np_stock').value);
  if (!isNaN(stock)) { D.inventory[p.id] = stock; STORE.set('inventory', D.inventory); }
  D.phones.push(p); STORE.set('phones', D.phones);
  closeModal('addProductModal');
  renderProductsTable(); renderPriceEditor();
  notify('Product added!', 'success');
}

function renderPriceEditor() {
  D = loadData();
  var ed = document.getElementById('priceEditor'); if (!ed) return;
  ed.innerHTML = D.phones.map(function(p,i){
    return '<div class="editor-card" style="display:grid;grid-template-columns:1fr auto auto;gap:1rem;align-items:center;flex-wrap:wrap;">' +
      '<div><div style="font-weight:700;font-size:.88rem;">'+esc(p.name)+'</div><div style="font-size:.72rem;color:var(--muted);">'+esc(p.series)+'</div></div>' +
      '<div><label class="field-label">Locked (GH₵)</label><input class="a-input" type="number" id="pl_'+i+'" value="'+p.locked+'" style="width:130px;"></div>' +
      '<div><label class="field-label">Unlocked (GH₵)</label><input class="a-input" type="number" id="pu_'+i+'" value="'+p.unlocked+'" style="width:130px;"></div>' +
    '</div>';
  }).join('');
}
function savePrices() {
  D = loadData();
  D.phones.forEach(function(p,i){
    var l = document.getElementById('pl_'+i), u = document.getElementById('pu_'+i);
    if (l) p.locked   = parseInt(l.value)||p.locked;
    if (u) p.unlocked = parseInt(u.value)||p.unlocked;
  });
  STORE.set('phones', D.phones);
  renderProductsTable();
  notify('Prices saved! Changes reflect live on the main site.', 'success');
}

// ════════════════════════════════════════════════
//  CUSTOMERS
// ════════════════════════════════════════════════
function renderCustomersTable() {
  D = loadData();
  // Build unique customers from orders
  var custMap = {};
  D.orders.forEach(function(o){
    var key = o.contact || o.name;
    if (!custMap[key]) custMap[key] = { name:o.name, contact:o.contact||'', email:o.email||'', orders:0, total:0 };
    custMap[key].orders++;
    custMap[key].total += (o.price||0);
  });
  var custs = Object.values(custMap).sort(function(a,b){ return b.total-a.total; });
  var cc = document.getElementById('custCount');
  if (cc) cc.textContent = custs.length + ' unique customers';
  var t = document.getElementById('customersTable'); if (!t) return;
  if (!custs.length) { t.innerHTML='<thead><tr><th colspan="5">No customers yet</th></tr></thead><tbody></tbody>'; return; }
  var h = '<thead><tr><th>Name</th><th>WhatsApp</th><th>Email</th><th>Orders</th><th>Total Spent</th></tr></thead>';
  var rows = custs.map(function(c){
    return '<tr>' +
      '<td class="td-strong">'+esc(c.name)+'</td>' +
      '<td>'+esc(c.contact)+'</td>' +
      '<td style="color:var(--muted);">'+esc(c.email||'—')+'</td>' +
      '<td>'+c.orders+'</td>' +
      '<td style="color:var(--green);font-weight:700;">GH₵ '+c.total.toLocaleString()+'</td>' +
    '</tr>';
  }).join('');
  t.innerHTML = h + '<tbody>' + rows + '</tbody>';
}

// ════════════════════════════════════════════════
//  INVENTORY
// ════════════════════════════════════════════════
function renderInventoryEditor() {
  D = loadData();
  var ed = document.getElementById('inventoryEditor'); if (!ed) return;
  ed.innerHTML = D.phones.map(function(p){
    var stock = D.inventory[p.id] !== undefined ? D.inventory[p.id] : 0;
    var cls = stock > 5 ? 'badge-in-stock' : stock > 0 ? 'badge-low' : 'badge-out';
    var lbl = stock > 5 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock';
    return '<div class="editor-card" style="display:grid;grid-template-columns:1fr 120px 100px;gap:1rem;align-items:center;">' +
      '<div><div style="font-weight:700;font-size:.88rem;">'+esc(p.name)+'</div><div style="font-size:.72rem;color:var(--muted);">'+esc(p.series)+'</div></div>' +
      '<div><label class="field-label">Stock Qty</label><input class="a-input" type="number" id="inv_'+esc(p.id)+'" value="'+stock+'" min="0"></div>' +
      '<div><div style="margin-top:1.1rem;"><span class="badge '+cls+'">'+lbl+'</span></div></div>' +
    '</div>';
  }).join('');
}
function saveInventory() {
  D = loadData();
  D.phones.forEach(function(p){
    var el = document.getElementById('inv_'+p.id);
    if (el) D.inventory[p.id] = parseInt(el.value)||0;
  });
  STORE.set('inventory', D.inventory);
  renderInventoryEditor();
  notify('Inventory saved!', 'success');
}

// ════════════════════════════════════════════════
//  SALES & REVENUE
// ════════════════════════════════════════════════
function renderSalesPanel() {
  D = loadData();
  var orders = D.orders;
  var totalRev = orders.reduce(function(s,o){ return s+(o.price||0); },0);
  var fullyPaid = orders.filter(function(o){ return o.paidStage==='Fully Paid'; });
  var deposits  = orders.filter(function(o){ return o.paidStage==='60% Deposit'; });
  var collected = fullyPaid.reduce(function(s,o){ return s+(o.price||0); },0)
                + deposits.reduce(function(s,o){ return s+Math.round((o.price||0)*0.6); },0);
  var outstanding = totalRev - collected;

  document.getElementById('salesStats').innerHTML =
    statCard('Total Revenue',   'GH₵ '+totalRev.toLocaleString(),    'All orders',          '') +
    statCard('Collected',       'GH₵ '+collected.toLocaleString(),   'Received so far',     '') +
    statCard('Outstanding',     'GH₵ '+outstanding.toLocaleString(), 'Balances due',        outstanding>0?'warn':'') +
    statCard('Avg Order Value', 'GH₵ '+(orders.length?Math.round(totalRev/orders.length):0).toLocaleString(), 'Per order', '');

  // Revenue by phone
  var modelRev = {};
  orders.forEach(function(o){
    var m = (o.phone||'Unknown').split('(')[0].trim();
    modelRev[m] = (modelRev[m]||0) + (o.price||0);
  });
  var sorted = Object.entries(modelRev).sort(function(a,b){ return b[1]-a[1]; });
  var maxR = sorted.length ? sorted[0][1] : 1;
  document.getElementById('salesChart').innerHTML = sorted.length
    ? sorted.map(function(e){ return barRow(e[0],e[1],maxR,'GH₵ '+e[1].toLocaleString()); }).join('')
    : '<p style="color:var(--muted);font-size:.82rem;">No data yet.</p>';

  // Payment method
  var methods = {};
  orders.forEach(function(o){ var m=o.method||'MoMo'; methods[m]=(methods[m]||0)+1; });
  var total = orders.length || 1;
  var sorted2 = Object.entries(methods).sort(function(a,b){ return b[1]-a[1]; });
  document.getElementById('payMethodChart').innerHTML = sorted2.length
    ? sorted2.map(function(e){ return barRow(e[0],e[1],total,e[1]+' orders'); }).join('')
    : '<p style="color:var(--muted);font-size:.82rem;">No data yet.</p>';
}

// ════════════════════════════════════════════════
//  CONTENT PANEL
// ════════════════════════════════════════════════
function renderContentPanel() {
  D = loadData();
  var c = D.content;
  setVal('editHeroTitle', c.heroTitle||'');
  setVal('editHeroSub',   c.heroSub||'');
  setVal('editWA',        c.whatsapp||'');
  setVal('editAirTime',   c.airTime||'3–4 Weeks');
  setVal('editSeaTime',   c.shipTime||'45–60 Days');

  // MoMo — delegate to dedicated renderer
  renderMomoEditor();

  // Testimonials
  renderTestimonialsEditor();
  // FAQs
  renderFaqsEditor();
}

function saveContent() {
  D = loadData();
  D.content.heroTitle = document.getElementById('editHeroTitle').value;
  D.content.heroSub   = document.getElementById('editHeroSub').value;
  D.content.whatsapp  = document.getElementById('editWA').value;
  STORE.set('content', D.content);
  notify('Hero content saved! Changes reflect live on the main site.','success');
}
function saveDelivery() {
  D = loadData();
  D.content.airTime   = document.getElementById('editAirTime').value;
  D.content.shipTime  = document.getElementById('editSeaTime').value;
  STORE.set('content', D.content);
  notify('Delivery times updated! Changes are live on the main site.','success');
}
function saveMomoNums() {
  D = loadData();
  Object.keys(D.momoNums).forEach(function(net){
    var n = document.getElementById('momo_num_'  + encodeURIComponent(net));
    var m = document.getElementById('momo_name_' + encodeURIComponent(net));
    if (n) D.momoNums[net].num  = n.value.trim();
    if (m) D.momoNums[net].name = m.value.trim();
  });
  STORE.set('momoNums', D.momoNums);
  notify('MoMo numbers saved!','success');
}

// Testimonials
function renderTestimonialsEditor() {
  D = loadData();
  var ed = document.getElementById('testimonialEditor'); if (!ed) return;
  ed.innerHTML = D.testimonials.map(function(t,i){
    return '<div class="editor-card" style="position:relative;">' +
      '<button onclick="deleteTestimonial('+i+')" class="btn btn-red btn-sm" style="position:absolute;top:.8rem;right:.8rem;">Remove</button>' +
      '<div class="field-row" style="margin-bottom:.6rem;">' +
        '<div><label class="field-label">Name</label><input class="a-input" id="tn_'+i+'" value="'+esc(t.name)+'"></div>' +
        '<div><label class="field-label">Model</label><input class="a-input" id="tm_'+i+'" value="'+esc(t.model)+'"></div>' +
      '</div>' +
      '<label class="field-label">Review</label>' +
      '<textarea class="a-textarea" id="tt_'+i+'" rows="2">'+esc(t.text)+'</textarea>' +
      '<button class="btn btn-blue btn-sm" style="margin-top:.6rem;" onclick="saveTestimonial('+i+')">Save</button>' +
    '</div>';
  }).join('');
}
function saveTestimonial(i) {
  D = loadData();
  D.testimonials[i].name  = document.getElementById('tn_'+i).value;
  D.testimonials[i].model = document.getElementById('tm_'+i).value;
  D.testimonials[i].text  = document.getElementById('tt_'+i).value;
  STORE.set('testimonials', D.testimonials);
  notify('Testimonial saved!','success');
}
function deleteTestimonial(i) {
  D = loadData(); D.testimonials.splice(i,1); STORE.set('testimonials',D.testimonials);
  renderTestimonialsEditor(); notify('Testimonial removed','success');
}
function addTestimonial() {
  D = loadData();
  D.testimonials.unshift({ name:'New Customer', model:'iPhone', stars:5, text:'Great service!' });
  STORE.set('testimonials',D.testimonials); renderTestimonialsEditor();
  notify('Testimonial added — edit and save','success');
}

// FAQs
function renderFaqsEditor() {
  D = loadData();
  var ed = document.getElementById('faqEditor'); if (!ed) return;
  ed.innerHTML = D.faqs.map(function(f,i){
    return '<div class="editor-card" style="position:relative;">' +
      '<button onclick="deleteFaq('+i+')" class="btn btn-red btn-sm" style="position:absolute;top:.8rem;right:.8rem;">Remove</button>' +
      '<label class="field-label">Question</label>' +
      '<input class="a-input" id="fq_'+i+'" value="'+esc(f.q)+'" style="margin-bottom:.6rem;">' +
      '<label class="field-label">Answer</label>' +
      '<textarea class="a-textarea" id="fa_'+i+'" rows="2">'+esc(f.a)+'</textarea>' +
      '<button class="btn btn-blue btn-sm" style="margin-top:.6rem;" onclick="saveFaq('+i+')">Save</button>' +
    '</div>';
  }).join('');
}
function saveFaq(i) {
  D = loadData();
  D.faqs[i].q = document.getElementById('fq_'+i).value;
  D.faqs[i].a = document.getElementById('fa_'+i).value;
  STORE.set('faqs',D.faqs); notify('FAQ saved!','success');
}
function deleteFaq(i) {
  D = loadData(); D.faqs.splice(i,1); STORE.set('faqs',D.faqs);
  renderFaqsEditor(); notify('FAQ removed','success');
}
function addFaq() {
  D = loadData();
  D.faqs.push({ q:'New Question?', a:'Your answer here.' });
  STORE.set('faqs',D.faqs); renderFaqsEditor();
  notify('FAQ added — edit and save','success');
}

// ════════════════════════════════════════════════
//  NOTIFICATIONS PANEL
// ════════════════════════════════════════════════
function renderNotifPanel() {
  D = loadData();
  var ns = D.notifSettings;
  setVal('adminEmail', ns.email||'');
  setVal('waAutoReply', ns.waReply||'');
  setChecked('notif_neworder', ns.neworder!==false);
  setChecked('notif_status',   ns.status!==false);
  setChecked('notif_stock',    !!ns.stock);
  setChecked('notif_daily',    !!ns.daily);
}
function saveNotifSettings() {
  D = loadData();
  D.notifSettings = {
    email:    document.getElementById('adminEmail').value.trim(),
    neworder: document.getElementById('notif_neworder').checked,
    status:   document.getElementById('notif_status').checked,
    stock:    document.getElementById('notif_stock').checked,
    daily:    document.getElementById('notif_daily').checked,
    waReply:  D.notifSettings.waReply||''
  };
  STORE.set('notifSettings', D.notifSettings);
  notify('Notification settings saved!','success');
}
function saveWAReply() {
  D = loadData();
  D.notifSettings.waReply = document.getElementById('waAutoReply').value;
  STORE.set('notifSettings', D.notifSettings);
  notify('WhatsApp reply template saved!','success');
}

// ════════════════════════════════════════════════
//  SEARCH
// ════════════════════════════════════════════════
function handleSearch(q) {
  if (!q.trim()) return;
  D = loadData();
  q = q.toLowerCase();
  var results = D.orders.filter(function(o){
    return (o.name||'').toLowerCase().includes(q) ||
           (o.id||'').toLowerCase().includes(q) ||
           (o.contact||'').toLowerCase().includes(q) ||
           (o.phone||'').toLowerCase().includes(q);
  });
  // Switch to orders panel and show results
  showPanel('orders', null);
  renderTableInto('allOrdersTable', results, false);
}

// ════════════════════════════════════════════════
//  EXPORT / IMPORT
// ════════════════════════════════════════════════
function exportData() {
  D = loadData();
  var blob = new Blob([JSON.stringify({
    phones:        D.phones,
    orders:        D.orders,
    content:       D.content,
    testimonials:  D.testimonials,
    faqs:          D.faqs,
    momoNums:      D.momoNums,
    inventory:     D.inventory,
    storageOptions:D.storageOptions,
    trustItems:    D.trustItems,
    imgOverrides:  D.imgOverrides,
    notifSettings: D.notifSettings
  }, null, 2)], { type:'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'iPre-Orders-data-' + todayStr() + '.json';
  a.click();
  notify('Data exported!','success');
}
function importData() {
  var input = document.createElement('input');
  input.type = 'file'; input.accept = '.json';
  input.onchange = function(e){
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      try {
        var data = JSON.parse(ev.target.result);
        if (data.phones)         STORE.set('phones',         data.phones);
        if (data.orders)         STORE.set('orders',         data.orders);
        if (data.content)        STORE.set('content',        data.content);
        if (data.testimonials)   STORE.set('testimonials',   data.testimonials);
        if (data.faqs)           STORE.set('faqs',           data.faqs);
        if (data.momoNums)       STORE.set('momoNums',       data.momoNums);
        if (data.inventory)      STORE.set('inventory',      data.inventory);
        if (data.storageOptions) STORE.set('storageOptions', data.storageOptions);
        if (data.trustItems)     STORE.set('trustItems',     data.trustItems);
        if (data.imgOverrides)   STORE.set('imgOverrides',   data.imgOverrides);
        if (data.notifSettings)  STORE.set('notifSettings',  data.notifSettings);
        D = loadData();
        renderOverview(); renderContentPanel(); renderNotifPanel();
        notify('Data imported successfully!','success');
      } catch(err) { notify('Invalid file format: ' + err.message,'error'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ════════════════════════════════════════════════
//  SIDEBAR (mobile)
// ════════════════════════════════════════════════
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ════════════════════════════════════════════════
//  MODALS
// ════════════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
// Close modal on backdrop click
document.querySelectorAll('.modal-bg').forEach(function(bg){
  bg.addEventListener('click', function(e){ if(e.target===bg) bg.classList.remove('open'); });
});

// ════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ════════════════════════════════════════════════
function notify(msg, type) {
  var el = document.createElement('div');
  el.className = 'notif ' + (type||'success');
  el.innerHTML = (type==='error'?'⚠️':'✓') + ' ' + msg;
  document.body.appendChild(el);
  setTimeout(function(){ el.style.animation='notifIn .3s reverse both'; setTimeout(function(){ el.remove(); },300); }, 2800);
}

// ════════════════════════════════════════════════
//  MOMO EDITOR (proper render, matches saveMomoNums)
// ════════════════════════════════════════════════
function renderMomoEditor() {
  D = loadData();
  var ed = document.getElementById('momoEditor'); if (!ed) return;
  ed.innerHTML = Object.entries(D.momoNums).map(function(e){
    var net = e[0], info = e[1];
    var safeKey = encodeURIComponent(net);
    return '<div class="editor-card" style="margin-bottom:.6rem;">' +
      '<div style="font-weight:700;font-size:.85rem;margin-bottom:.7rem;">📲 ' + esc(net) + '</div>' +
      '<div class="field-row">' +
        '<div><label class="field-label">Number</label>' +
          '<input class="a-input" id="momo_num_' + safeKey + '" value="' + esc(info.num) + '"></div>' +
        '<div><label class="field-label">Account Name</label>' +
          '<input class="a-input" id="momo_name_' + safeKey + '" value="' + esc(info.name) + '"></div>' +
      '</div>' +
    '</div>';
  }).join('') +
  '<button class="btn btn-blue btn-sm" style="margin-top:.4rem;" onclick="saveMomoNums()">Save MoMo Numbers</button>';
}

// ════════════════════════════════════════════════
//  PHONE IMAGES EDITOR
// ════════════════════════════════════════════════
// Default image URLs from original site (used as fallback preview)
var PHONE_IMGS_DEFAULT = {
  ip16:    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1723134927077',
  ip16p:   'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1724926709976',
  ip16pm:  'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-max-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1724926763527',
  ip17:    'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1723134927077',
  ip17air: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-plus-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1723134927544',
  ip17p:   'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1724926709976',
  ip17pm:  'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-max-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1724926763527',
  ip17e:   'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-model-unselect-gallery-1-202409?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1723134927077'
};

function renderPhoneImagesEditor() {
  D = loadData();
  var ed = document.getElementById('phoneImagesEditor'); if (!ed) return;
  ed.innerHTML = D.phones.map(function(p){
    var override = D.imgOverrides[p.id];
    var previewSrc = override || PHONE_IMGS_DEFAULT[p.id] || '';
    return '<div class="editor-card" style="display:flex;gap:1.2rem;align-items:flex-start;flex-wrap:wrap;">' +
      '<div style="flex-shrink:0;">' +
        '<img src="' + previewSrc + '" alt="' + esc(p.name) + '" id="imgPrev_' + p.id + '" ' +
          'style="width:88px;height:88px;object-fit:contain;background:#fff;border-radius:10px;border:1px solid var(--border);padding:6px;"' +
          ' onerror="this.style.background=\'var(--surface2)\';this.alt=\'No image\'">' +
      '</div>' +
      '<div style="flex:1;min-width:200px;">' +
        '<div style="font-weight:700;font-size:.88rem;margin-bottom:.5rem;">' + esc(p.name) + '</div>' +
        '<label class="field-label">Upload New Photo</label>' +
        '<input type="file" accept="image/*" id="imgFile_' + p.id + '" ' +
          'onchange="handlePhoneImgUpload(\'' + p.id + '\')" ' +
          'style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:.45rem;color:var(--text);font-size:.78rem;cursor:pointer;">' +
        '<div id="imgProgress_' + p.id + '" style="display:none;margin-top:.5rem;">' +
          '<div style="background:var(--surface3);border-radius:4px;height:4px;overflow:hidden;">' +
            '<div id="imgProgressBar_' + p.id + '" style="height:100%;background:var(--accent);width:0%;transition:width .2s;border-radius:4px;"></div>' +
          '</div>' +
          '<div id="imgProgressTxt_' + p.id + '" style="font-size:.7rem;color:var(--muted);margin-top:.3rem;">Uploading…</div>' +
        '</div>' +
        (override
          ? '<button onclick="resetPhoneImg(\'' + p.id + '\')" class="btn btn-red btn-sm" style="margin-top:.5rem;">↩ Reset to default</button>'
          : '<div style="font-size:.72rem;color:var(--muted);margin-top:.4rem;">Using default image</div>') +
      '</div>' +
    '</div>';
  }).join('');
}

function compressImage(file, callback) {
  var MAX_SIZE = 480; // max width or height in px
  var QUALITY  = 0.82; // JPEG quality (0–1)
  var reader = new FileReader();
  reader.onload = function(ev) {
    var image = new Image();
    image.onload = function() {
      var w = image.width, h = image.height;
      // Scale down while preserving aspect ratio
      if (w > MAX_SIZE || h > MAX_SIZE) {
        if (w > h) { h = Math.round(h * MAX_SIZE / w); w = MAX_SIZE; }
        else        { w = Math.round(w * MAX_SIZE / h); h = MAX_SIZE; }
      }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(image, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', QUALITY));
    };
    image.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function handlePhoneImgUpload(phoneId) {
  var input = document.getElementById('imgFile_' + phoneId);
  if (!input || !input.files || !input.files[0]) return;
  var file = input.files[0];

  var progressWrap = document.getElementById('imgProgress_' + phoneId);
  var progressBar  = document.getElementById('imgProgressBar_' + phoneId);
  var progressTxt  = document.getElementById('imgProgressTxt_' + phoneId);
  if (progressWrap) progressWrap.style.display = 'block';
  if (progressBar)  progressBar.style.width = '30%';
  if (progressTxt)  progressTxt.textContent = 'Compressing…';

  compressImage(file, function(dataUrl) {
    if (progressBar) progressBar.style.width = '70%';
    if (progressTxt) progressTxt.textContent = 'Saving…';

    // Save to its own doc in phone-images collection (avoids 1MB Firestore doc limit)
    _imgCol.doc(phoneId).set({ img: dataUrl }).then(function() {
      if (progressBar) progressBar.style.width = '100%';

      // Also update the main site doc so onSnapshot picks it up on the storefront
      D = loadData();
      D.imgOverrides[phoneId] = dataUrl;
      _cache.imgOverrides = D.imgOverrides;
      _db.collection('site').doc('data').set({ imgOverrides: D.imgOverrides }, { merge: true });

      var prev = document.getElementById('imgPrev_' + phoneId);
      if (prev) prev.src = dataUrl;

      setTimeout(function() { if (progressWrap) progressWrap.style.display = 'none'; }, 400);
      var kb = Math.round((dataUrl.length * 3/4) / 1024);
      notify('Photo saved! (' + kb + ' KB)', 'success');
      setTimeout(renderPhoneImagesEditor, 300);
    }).catch(function(err) {
      console.error('Firestore image save error:', err);
      if (progressWrap) progressWrap.style.display = 'none';
      notify('Save failed: ' + err.message, 'error');
    });
  });
}

function resetPhoneImg(phoneId) {
  D = loadData();
  delete D.imgOverrides[phoneId];
  _cache.imgOverrides = D.imgOverrides;
  // Remove from dedicated doc and update main doc
  _imgCol.doc(phoneId).delete();
  _db.collection('site').doc('data').set({ imgOverrides: D.imgOverrides }, { merge: true });
  var prev = document.getElementById('imgPrev_' + phoneId);
  if (prev) prev.src = PHONE_IMGS_DEFAULT[phoneId] || '';
  notify('Photo reset to default', 'success');
  setTimeout(renderPhoneImagesEditor, 300);
}

// ════════════════════════════════════════════════
//  STORAGE OPTIONS EDITOR
// ════════════════════════════════════════════════
var STORAGE_GROUPS = [
  { key:'16',  label:'iPhone 16 series (standard & Plus)' },
  { key:'17',  label:'iPhone 17 series (standard)' },
  { key:'pro', label:'Pro & Pro Max (all generations)' },
  { key:'air', label:'iPhone 17 Air' },
  { key:'e',   label:'iPhone 17e' }
];

function renderStorageEditor() {
  D = loadData();
  var ed = document.getElementById('storageOptionsEditor'); if (!ed) return;
  ed.innerHTML = STORAGE_GROUPS.map(function(g){
    var current = (D.storageOptions[g.key] || []).join(', ');
    return '<div class="editor-card">' +
      '<div style="font-weight:700;font-size:.88rem;margin-bottom:.3rem;">' + g.label + '</div>' +
      '<label class="field-label" style="margin-top:.4rem;">Storage sizes (comma-separated)</label>' +
      '<input class="a-input" type="text" id="sto_' + g.key + '" value="' + esc(current) + '" placeholder="e.g. 128GB, 256GB, 512GB, 1TB">' +
      '<div style="font-size:.72rem;color:var(--muted);margin-top:.4rem;">These appear as options in the checkout storage picker.</div>' +
    '</div>';
  }).join('');
}

function saveStorageOptions() {
  D = loadData();
  STORAGE_GROUPS.forEach(function(g){
    var el = document.getElementById('sto_' + g.key);
    if (el) D.storageOptions[g.key] = el.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  });
  STORE.set('storageOptions', D.storageOptions);
  notify('Storage options saved!', 'success');
}

// ════════════════════════════════════════════════
//  TRUST BAR EDITOR
// ════════════════════════════════════════════════
function renderTrustEditor() {
  D = loadData();
  var ed = document.getElementById('trustBarEditor'); if (!ed) return;
  ed.innerHTML = D.trustItems.map(function(t, i){
    return '<div style="display:flex;gap:.5rem;align-items:center;">' +
      '<input class="a-input" type="text" id="trust_' + i + '" value="' + esc(t) + '">' +
      '<button class="btn btn-red btn-sm" onclick="deleteTrustItem(' + i + ')">✕</button>' +
    '</div>';
  }).join('');
}

function saveTrustBar() {
  D = loadData();
  D.trustItems = D.trustItems.map(function(t, i){
    var el = document.getElementById('trust_' + i);
    return el ? el.value : t;
  });
  STORE.set('trustItems', D.trustItems);
  notify('Trust bar saved!', 'success');
}

function addTrustItem() {
  D = loadData();
  D.trustItems.push('New item');
  STORE.set('trustItems', D.trustItems);
  renderTrustEditor();
}

function deleteTrustItem(i) {
  D = loadData();
  D.trustItems.splice(i, 1);
  STORE.set('trustItems', D.trustItems);
  renderTrustEditor();
  notify('Item removed', 'success');
}

// ════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function todayStr() {
  var d = new Date();
  return d.getDate().toString().padStart(2,'0') + '/' + (d.getMonth()+1).toString().padStart(2,'0') + '/' + d.getFullYear();
}
function setVal(id, val) { var el=document.getElementById(id); if(el) el.value=val; }
function setChecked(id, val) { var el=document.getElementById(id); if(el) el.checked=val; }

// ════════════════════════════════════════════════
//  REAL-TIME: reflect changes from other devices instantly
// ════════════════════════════════════════════════
_db.collection('site').doc('data').onSnapshot(function(snap) {
  if (!snap.exists) return;
  var fresh = snap.data();
  _cache = fresh;
  D = loadData();
  // Re-render even if not yet logged in — data stays updated
  if (document.getElementById('app') && document.getElementById('app').classList.contains('visible')) {
    renderOverview();
  var active = document.querySelector('.panel.active');
  if (active) {
    var id = active.id.replace('panel','').toLowerCase();
    if (id === 'orders')    renderOrdersTable();
    if (id === 'products')  { renderProductsTable(); renderPriceEditor(); }
    if (id === 'customers') renderCustomersTable();
    if (id === 'inventory') renderInventoryEditor();
    if (id === 'sales')     renderSalesPanel();
    if (id === 'trustbar')  renderTrustEditor();
    if (id === 'storage')   renderStorageEditor();
    if (id === 'phoneimages') renderPhoneImagesEditor();
  }
  } // end app visible check
});
