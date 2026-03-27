// ===== 구매 견적 함수 =====


// ══════════════════════════════════════════════════════════════════
//  ■ 구매견적 시스템
// ══════════════════════════════════════════════════════════════════
let products = [], specCategories = [], specOptions = [];
let quoteItems = [];
let currentSpecProductId = null;
let selectedSpecOpts = {};
let editingQuoteId = null;
let currentQuoteNum = '';
let currentShareToken = null;
let _lastPreviewHtml = '';

function initQuoteNum() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  currentQuoteNum = 'Q'+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'-'+pad(now.getHours())+pad(now.getMinutes());
}

async function loadAllData() {
  await Promise.all([loadProducts(), loadSpecCategories(), loadSpecOptions()]);
}
async function loadProducts() {
  try {
    const { data, error } = await db.from('products').select('*').eq('is_active',true).order('category');
    if (error || !data || data.length === 0) {
      // DB 데이터 없을 때 샘플 데이터 사용
      products = (typeof SAMPLE_PRODUCTS !== 'undefined') ? SAMPLE_PRODUCTS.map((p,i)=>({...p,id:i+1})) : [];
    } else {
      products = data.map(p=>({...p, _fromDB:true}));
    }
  } catch(e) {
    products = (typeof SAMPLE_PRODUCTS !== 'undefined') ? SAMPLE_PRODUCTS.map((p,i)=>({...p,id:i+1})) : [];
  }
  renderProducts();
}
async function loadSpecCategories() {
  try {
    const { data } = await db.from('spec_categories').select('*').order('sort_order');
    specCategories = data || [];
  } catch(e) { specCategories = []; }
}
async function loadSpecOptions() {
  try {
    const { data } = await db.from('spec_options').select('*').order('sort_order');
    specOptions = data || [];
  } catch(e) { specOptions = []; }
}

function fmtSpec(spec) {
  if (!spec) return '';
  // KEY: 라벨 제거 (CPU:, RAM:, SSD:, VGA:, ODD:, POWER:, OS:, 크기:, 해상도:, 패널:, 밝기:, 연결단자:, 스탠드:, 기타: 등)
  let s = spec.replace(/\b(CPU|RAM|SSD|HDD|VGA|ODD|POWER|OS|크기|해상도|패널|밝기|연결단자|스탠드|기타|무게|배터리|카메라|인터페이스|포트|네트워크|무선|터치|스피커|마이크|색상|재질|인증|보증|특징|구성|용량|속도|타입|형태|방식|채널|주파수|감도|임피던스|SNR|왜율|종류|규격|모델):\s*/gi, '');
  // 콤마+공백 또는 콤마 뒤에 특정 키워드가 오는 경우만 / 로 변환
  // 단, 값 내부의 콤마(i3,i5,i7 같은)는 그대로 유지
  // 줄바꿈을 / 로 변환
  s = s.replace(/\n/g, ' / ');
  // 앞뒤 공백 정리
  s = s.replace(/\/\s*\//g, ' / ').trim();
  return s;
}

function renderProducts() {
  const cat = document.getElementById('f-cat').value;
  const brand = document.getElementById('f-brand').value;
  let list = products;
  if (cat) list = list.filter(p=>p.category===cat);
  if (brand) list = list.filter(p=>p.brand===brand);
  const el = document.getElementById('product-list');
  if (!list.length) { el.innerHTML='<div class="no-products">제품 없음</div>'; return; }
  el.innerHTML = list.map(p=>`
    <div class="product-card" onclick="openSpecModal('${p.id}')">
      <div class="pc-name">${p.name}</div>
      <div class="pc-brand">${p.category} · ${p.brand}</div>
      <div class="pc-price">${p.base_price > 0 ? fmt(p.base_price)+'원' : '가격 문의'}</div>
    </div>`).join('');
}

function openSpecModal(productId) {
  const p = products.find(x=>String(x.id)===String(productId));
  if (!p) return;
  currentSpecProductId = productId;
  selectedSpecOpts = {};
  document.getElementById('aq-title').textContent = '제품 상세';
  const specSummaryHtml = p.spec_summary ? '<div style="color:#64748b;font-size:11px;margin-top:4px;line-height:1.5;">'+fmtSpec(p.spec_summary)+'</div>' : '';
  const featureHtml = p.feature ? '<div style="color:#475569;font-size:11px;margin-top:4px;padding:6px 8px;background:#f8fafc;border-radius:4px;line-height:1.5;">'+p.feature+'</div>' : '';
  document.getElementById('aq-product-info').innerHTML = `
    <div class="atq-name">${p.name}</div>
    <div class="atq-meta">
      ${p.category?`<span>${p.category}</span>`:''}
      ${p.brand?`<span style="color:#94a3b8;">|</span><span>${p.brand}</span>`:''}
      ${p.info_url?`<span style="color:#22c55e;font-size:11px;margin-left:4px;" title="이미지/링크 있음">✅</span>`:''}
      ${p.base_price?`<span style="color:#94a3b8;">|</span><span style="color:#1B3A6B;font-weight:700;">₩ ${fmt(p.base_price)}</span>`:''}
    </div>
    ${p.spec_summary?`<div class="atq-spec">${fmtSpec(p.spec_summary)}</div>`:''}
    ${p.feature?`<div style="margin-top:6px;padding:6px 10px;background:#fff3cd;border:1px solid #ffc107;border-radius:6px;font-size:11px;color:#856404;line-height:1.5;">${p.feature}</div>`:''}
  `;
  const cats = specCategories.filter(c=>c.product_categories?.includes(p.category)||!c.product_categories?.length);
  let optsHtml = '';
  for (const cat of cats) {
    const opts = specOptions.filter(o=>o.spec_category_id===cat.id);
    if (!opts.length) continue;
    optsHtml += `<div style="margin-bottom:10px;"><div class="field-label" style="margin-bottom:6px;">${cat.name}</div><div class="spec-opt-grid">`;
    optsHtml += opts.map(o=>`<div class="spec-opt-card" id="soc-${o.id}" onclick="toggleSpecOpt('${cat.id}','${o.id}',${o.price_delta})"><div class="opt-name">${o.name}</div><div class="opt-price">${o.price_delta>0?'+':''}${o.price_delta?fmt(o.price_delta)+'원':'포함'}</div></div>`).join('');
    optsHtml += '</div></div>';
  }
  document.getElementById('spec-opts').innerHTML = optsHtml;
  document.getElementById('aq-unit').value = p.base_price;
  document.getElementById('aq-qty').value = 1;
  updateAQCalc();
  openModal('modal-aq');
}

function toggleSpecOpt(catId, optId, delta) {
  if (selectedSpecOpts[catId] === optId) {
    delete selectedSpecOpts[catId];
    document.getElementById('soc-'+optId)?.classList.remove('selected');
  } else {
    if (selectedSpecOpts[catId]) document.getElementById('soc-'+selectedSpecOpts[catId])?.classList.remove('selected');
    selectedSpecOpts[catId] = optId;
    document.getElementById('soc-'+optId)?.classList.add('selected');
  }
  resetAQPrice();
}
function updateAQCalc() {
  const unit = parseInt(document.getElementById('aq-unit').value)||0;
  const qty = parseInt(document.getElementById('aq-qty').value)||1;
  document.getElementById('aq-total-val').textContent = fmt(unit*qty)+' 원';
}
function resetAQPrice() {
  const p = products.find(x=>String(x.id)===String(currentSpecProductId));
  if (!p) return;
  let total = p.base_price;
  for (const optId of Object.values(selectedSpecOpts)) {
    const opt = specOptions.find(o=>o.id===optId);
    if (opt) total += (opt.price_delta||0);
  }
  document.getElementById('aq-unit').value = total;
  updateAQCalc();
}

function addToQuote() {
  const p = products.find(x=>String(x.id)===String(currentSpecProductId));
  if (!p) return;
  const unit = parseInt(document.getElementById('aq-unit').value)||0;
  const qty = parseInt(document.getElementById('aq-qty').value)||1;
  const specs = Object.values(selectedSpecOpts).map(id=>{
    const cat = specCategories.find(c=>c.id===Object.keys(selectedSpecOpts).find(k=>selectedSpecOpts[k]===id));
    const opt = specOptions.find(o=>o.id===id);
    return opt?opt.name:'';
  }).filter(Boolean);
  const specSummary = specs.join(', ');
  quoteItems.push({
    product_id: p.id, product_name: p.name, brand: p.brand, category: p.category,
    spec_summary: specSummary || p.spec_summary, unit_price: unit, qty, total_price: unit*qty,
    _fromDB: !!p._fromDB, info_url: p.info_url || null
  });
  renderQuoteItems(); calcPrice(); closeModal('modal-aq');
  showToast(p.name+' 추가됨', 'success');
}

function renderQuoteItems() {
  const el = document.getElementById('quote-items-area');
  if (!quoteItems.length) {
    el.innerHTML='<div class="no-products" style="padding:16px 0">좌측 카탈로그에서 제품을 클릭하여 추가하세요</div>';
    return;
  }
  el.innerHTML = `<table class="items-table"><thead><tr><th style="width:70px;">브랜드</th><th>제품명 / 사양</th><th style="text-align:right;min-width:90px;">단가</th><th style="text-align:center;min-width:100px;">수량</th><th></th></tr></thead><tbody>
    ${quoteItems.map((it,i)=>`<tr>
      <td style="text-align:center;vertical-align:middle;padding:6px 4px;">
        <div style="font-size:10.5px;font-weight:700;color:#1B3A6B;white-space:nowrap;">${it.brand||''}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${it.category||''}</div>
      </td>
      <td><strong>${it.product_name}</strong>${it.spec_summary ? `<div style="font-size:10.5px;color:#64748b;margin-top:3px;line-height:1.4;">${fmtSpec(it.spec_summary)}</div>` : ''}</td>
      <td style="text-align:right;font-size:12px;">${fmt(it.unit_price)}원</td>
      <td style="text-align:center;">
        <div class="qty-stepper">
          <button class="qty-btn" onclick="changeQty(${i},${it.qty}-1)">−</button>
          <span class="qty-display">${it.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i},${it.qty}+1)">+</button>
        </div>
      </td>
      <td><button class="btn-rm" onclick="removeItem(${i})">✕</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}

function changeQty(i, v) {
  quoteItems[i].qty = parseInt(v)||1;
  quoteItems[i].total_price = quoteItems[i].unit_price * quoteItems[i].qty;
  renderQuoteItems(); calcPrice();
}
function removeItem(i) { quoteItems.splice(i,1); renderQuoteItems(); calcPrice(); }

function calcPrice() {
  const sub = quoteItems.reduce((s,it)=>s+it.total_price,0);
  const rate = parseFloat(document.getElementById('discount-rate').value)||0;
  const discAmt = Math.round(sub*rate/100);
  document.getElementById('discount-amt').value = discAmt;
  const supply = sub - discAmt;
  const vat = Math.round(supply*0.1);
  document.getElementById('sum-subtotal').textContent = fmt(sub)+' 원';
  document.getElementById('sum-supply').textContent = fmt(supply)+' 원';
  document.getElementById('sum-vat').textContent = fmt(vat)+' 원';
  document.getElementById('sum-total').textContent = fmt(supply+vat)+' 원';
}
function calcPriceByAmt() {
  const sub = quoteItems.reduce((s,it)=>s+it.total_price,0);
  const discAmt = parseInt((document.getElementById('discount-amt')||{}).value)||0;
  document.getElementById('discount-rate').value = sub>0?(discAmt/sub*100).toFixed(1):0;
  const supply = sub - discAmt;
  const vat = Math.round(supply*0.1);
  document.getElementById('sum-subtotal').textContent = fmt(sub)+' 원';
  document.getElementById('sum-supply').textContent = fmt(supply)+' 원';
  document.getElementById('sum-vat').textContent = fmt(vat)+' 원';
  document.getElementById('sum-total').textContent = fmt(supply+vat)+' 원';
}

async function saveQuote() {
  const company = document.getElementById('f-company').value.trim();
  if (!company) { showToast('회사명을 입력하세요', 'error'); return; }
  if (!quoteItems.length) { showToast('견적 품목을 추가하세요', 'error'); return; }
  if (!db) { showToast('DB 연결이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.', 'error'); return; }
  const btn = document.getElementById('btn-save-quote');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
  try {
    const sub = quoteItems.reduce((s,it)=>s+it.total_price,0);
    const discAmt = parseInt(document.getElementById('discount-amt').value)||0;
    const supply = sub - discAmt;
    const vat = Math.round(supply*0.1);
    if (!currentShareToken) currentShareToken = Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,10);
    const payload = {
      quote_number: currentQuoteNum, share_token: currentShareToken,
      company_name: company,
      contact_name: (document.getElementById('f-contact')||{}).value||null,
      contact_tel: (document.getElementById('f-phone')||{}).value||null,
      contact_email: (document.getElementById('f-email')||{}).value||null,
      delivery_date: (document.getElementById('f-delivery')||{}).value||null,
      valid_until: (document.getElementById('f-validity')||{value:'견적일로부터 30일'}).value||'견적일로부터 30일',
      memo: (document.getElementById('f-memo')||{}).value||null,
      subtotal:sub, discount_amount:discAmt, supply_price:supply, vat, total:supply+vat,
      status:'draft',
      sales_name: (document.getElementById('f-sales-name')||{}).value||null,
      sales_phone: (document.getElementById('f-sales-phone')||{}).value||null,
      sales_email: (document.getElementById('f-sales-email')||{}).value||null,
    };
    let qId;
    if (editingQuoteId) {
      let {error} = await db.from('quotes').update(payload).eq('id',editingQuoteId);
      if (error && error.message && error.message.includes('column')) {
        // sales 컬럼이 DB에 없는 경우 제외하고 재시도
        const {sales_name,sales_phone,sales_email,...basePayload} = payload;
        ({error} = await db.from('quotes').update(basePayload).eq('id',editingQuoteId));
      }
      if (error) throw new Error('견적 업데이트 실패: '+error.message);
      const {error:delErr} = await db.from('quote_items').delete().eq('quote_id',editingQuoteId);
      if (delErr) throw new Error('기존 품목 삭제 실패: '+delErr.message);
      qId = editingQuoteId;
    } else {
      let {data,error} = await db.from('quotes').insert(payload).select().single();
      if (error && error.message && error.message.includes('column')) {
        // sales 컬럼이 DB에 없는 경우 제외하고 재시도
        const {sales_name,sales_phone,sales_email,...basePayload} = payload;
        ({data,error} = await db.from('quotes').insert(basePayload).select().single());
      }
      if (error) throw new Error('견적 생성 실패: '+error.message);
      qId = data.id; editingQuoteId = qId;
    }
    // product_id: DB 제품은 실제 id, 샘플 제품은 null로 처리 (FK 오류 방지)
    const itemsPayload = quoteItems.map((it,i)=>({
      quote_id: qId,
      product_id: (it._fromDB && it.product_id) ? it.product_id : null,
      product_name: it.product_name,
      brand: it.brand,
      category: it.category,
      spec_summary: it.spec_summary||'',
      unit_price: it.unit_price,
      qty: it.qty,
      total_price: it.total_price,
      sort_order: i,
      info_url: it.info_url || null
    }));
    const {error:itemErr} = await db.from('quote_items').insert(itemsPayload);
    if (itemErr) throw new Error('품목 저장 실패: '+itemErr.message);
    showToast('견적이 저장되었습니다! ('+currentQuoteNum+')', 'success'); loadHistory();
  } catch(e) {
    console.error('saveQuote 오류:', e);
    showToast('저장 실패: '+e.message, 'error');
    alert('⚠️ 저장 실패\n' + e.message + '\n\n브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 저장'; }
  }
}

function previewQuote() {
  if (!quoteItems.length) { showToast('견적 품목을 추가하세요','error'); return; }
  const co = v=>(document.getElementById(v)||{}).value||'';
  const company = co('f-company')||'(미입력)';
  const contact = co('f-contact'), phone = co('f-phone'), email = co('f-email');
  const salesName = co('f-sales-name'), salesPhone = co('f-sales-phone');
  const salesEmail = co('f-sales-email'), salesDept = co('f-sales-dept');
  const delivery = co('f-delivery'), validity = co('f-validity');
  const memo = co('f-memo');
  const sub = quoteItems.reduce((s,it)=>s+it.total_price,0);
  const discAmt = parseInt(co('discount-amt'))||0;
  const supply = sub - discAmt;
  const vat = Math.round(supply*0.1);
  const total = supply + vat;
  const today = new Date().toLocaleDateString('ko-KR');
  const introHtml = '<a href="https://buneed-estimate.vercel.app/Buneed.pdf" target="_blank" class="q-intro-btn" style="display:inline-block;padding:3px 12px;border:1.5px solid #1B3A6B;border-radius:99px;font-size:11px;color:#1B3A6B;font-weight:600;text-decoration:none;background:#fff;margin-top:4px;">회사소개서</a>';
    const itemsHtml = quoteItems.map((it,i)=>{
    const specText = it.spec_summary ? fmtSpec(it.spec_summary) : '';
    return `
    <tr>
      <td style="text-align:center;width:28px;font-size:11px;color:#64748b;border-bottom:1px solid #e8edf5;">${i+1}</td>
      <td style="text-align:center;padding:6px 8px;border-bottom:1px solid #e8edf5;min-width:70px;vertical-align:middle;">
        <div style="font-size:10.5px;font-weight:700;color:#1B3A6B;white-space:nowrap;">${it.brand||''}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;">${it.category||''}</div>
      </td>
      <td style="min-width:120px;padding:8px 10px;border-bottom:1px solid #e8edf5;">
        ${it.info_url ? `<a href="${it.info_url}" target="_blank" style="font-weight:700;font-size:12px;color:#1B3A6B;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;display:inline-flex;align-items:center;gap:0;">${it.product_name}<svg width="10" height="10" viewBox="0 0 12 12" fill="none" style="display:inline;vertical-align:middle;margin-left:3px;flex-shrink:0;"><path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="#1B3A6B" stroke-width="1.5"/><path d="M8 2h2v2M10 2 6 6" stroke="#1B3A6B" stroke-width="1.5" stroke-linecap="round"/></svg></a>` : `<div style="font-weight:700;font-size:12px;color:#1e293b;">${it.product_name}</div>`}
        ${specText ? `<div style="font-size:10.5px;color:#475569;line-height:1.5;margin-top:3px;">${specText}</div>` : ''}
      </td>
      <td style="text-align:right;white-space:nowrap;font-weight:600;font-size:12px;min-width:90px;border-bottom:1px solid #e8edf5;">${fmt(it.unit_price)}원</td>
      <td style="text-align:center;font-weight:600;border-bottom:1px solid #e8edf5;">${it.qty}</td>
      <td style="text-align:right;font-weight:700;white-space:nowrap;font-size:12px;border-bottom:1px solid #e8edf5;">${fmt(it.total_price)}원</td>
    </tr>`;
  }).join('');
  const html = `
  <div class="qdoc">
    <div class="q-header">
      <div style="text-align:left;">
        <h1 style="color:#1B3A6B;font-size:28px;font-weight:800;letter-spacing:0.05em;margin:0 0 8px 0;text-align:left;">구매 견적서</h1>
        <div class="q-header-meta" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;">
          <div class="q-date">작성일: ${today}</div>
          <div class="q-date">견적번호: ${currentQuoteNum}</div>
        </div>
      </div>
      <div class="q-logo-area" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <img src="${LOGO_SRC}" alt="비유니드"><br>
        
        ${introHtml}
      </div>
    </div>
    <div class="q-section">
      
      <div class="q-party-grid">
        <!-- 수신 박스: 연한 파란 배경 + 네이비 헤더바 -->
        <div style="border:1px solid #b8cde8;border-radius:6px;overflow:hidden;">
          <div style="background:#0E76BB;padding:7px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.1em;">수 신</span>
          </div>
          <div style="background:#ffffff;padding:10px 12px;">
            <table style="font-size:12px;width:100%;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:3px 0;width:32%;font-size:11px;">업체명</td><td style="font-weight:700;color:#1e293b;">${company}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">담당자</td><td>${contact||'-'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">연락처</td><td>${phone||'-'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">이메일</td><td>${email||'-'}</td></tr>
            </table>
          </div>
        </div>
        <!-- 공급 박스: 흰 배경 + 네이비 헤더바 -->
        <div style="border:1px solid #b8cde8;border-radius:6px;overflow:hidden;">
          <div style="background:#1B3A6B;padding:7px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.1em;">공 급</span>
          </div>
          <div style="background:#fff;padding:10px 12px;">
            <table style="font-size:12px;width:100%;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:3px 0;width:32%;font-size:11px;">업체명</td><td style="font-weight:700;color:#1e293b;">(주) 비유니드</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">담당자</td><td>${salesName||'-'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">연락처</td><td>${salesPhone||'031.8028.0464'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">이메일</td><td>${salesEmail||'sales@buneed.co.kr'}</td></tr>
            </table>
          </div>
        </div>
      </div>
      <div class="q-info-grid" style="margin-top:12px;">
        <div style="border:1px solid #bcd0ee;border-radius:6px;overflow:hidden;">
          <div style="background:#f1f5f9;padding:5px 10px;">
            <span style="font-size:13px;font-weight:700;color:#1B3A6B;">납품 / 유효 기간</span>
          </div>
          <div style="padding:8px 12px;background:#ffffff;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
              <span style="font-size:12px;color:#64748b;min-width:64px;">납품희망일</span>
              <span style="font-size:12px;font-weight:600;color:#1e293b;">${delivery||'미정'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:12px;color:#64748b;min-width:64px;">견적유효기간</span>
              <span style="font-size:12px;font-weight:600;color:#1e293b;">${validity||'견적일로부터 30일'}</span>
            </div>
          </div>
        </div>
        <div style="border:1px solid #bcd0ee;border-radius:6px;overflow:hidden;">
          <div style="background:#f1f5f9;padding:5px 10px;">
            <span style="font-size:13px;font-weight:700;color:#1B3A6B;">특이사항</span>
          </div>
          <div style="padding:8px 12px;background:#ffffff;min-height:60px;">
            <div style="font-size:12px;color:#374151;line-height:1.6;">${memo||''}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="q-section">
      <div class="q-section-title">▪ 견적 내용</div>
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table class="q-table">
        <thead><tr>
          <th style="width:24px;text-align:center;font-size:12px;">No</th>
          <th style="text-align:center;width:65px;font-size:12px;">브랜드</th>
          <th style="text-align:left;min-width:120px;">제품명 / 사양</th>
          <th style="text-align:right;white-space:nowrap;width:75px;font-size:12px;">단가</th>
          <th style="text-align:center;width:52px;white-space:nowrap;">수량</th>
          <th style="text-align:right;white-space:nowrap;min-width:80px;">금액</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      </div>
    </div>
    ${''/* 납품일/유효기간은 위에 표시됨 */}
    <table class="q-summary-table">
      <tr><td>소 계</td><td>${fmt(sub)} 원</td></tr>
      ${discAmt>0?`<tr><td style="color:#ef4444;">할인</td><td style="color:#ef4444;">- ${fmt(discAmt)} 원</td></tr>`:''}
      <tr><td style="font-weight:600;">공급가액</td><td style="font-weight:600;">${fmt(supply)} 원</td></tr>
      <tr><td>부가세 (10%)</td><td>${fmt(vat)} 원</td></tr>
      <tr class="q-total-row"><td>합 계</td><td>${fmt(total)} 원</td></tr>
    </table>

    <div class="q-spacer"></div>
    <div class="q-footer-bar">(주) 비유니드 | 경기도 하남시 미사강변한강로 135 다동 4층 445호 | 031.8028.0464 | www.buneed.co.kr</div>
  </div>`;
  _lastPreviewHtml = html;
  document.getElementById('preview-content').innerHTML = html;
  openModal('modal-preview');
}

function printQuote() {
  const modal = document.getElementById('modal-preview');
  if (!modal || !modal.classList.contains('open')) {
    previewQuote();
    setTimeout(() => window.print(), 500);
    return;
  }
  window.print();
}

/* copyQuoteLink v1 removed – using async v2 */


async function copyQuoteLink(shareToken, quoteNum) {
  if (!shareToken) { showToast('공유 링크가 없습니다', 'error'); return; }
  const url = `${location.origin}${location.pathname}?share=${shareToken}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast(`[${quoteNum}] 링크 복사됨!`, 'success');
  } catch(e) {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`[${quoteNum}] 링크 복사됨!`, 'success');
  }
}

async function copyHistoryLink() {
  if (!currentShareToken) { showToast('먼저 견적을 불러오세요', 'error'); return; }
  const url = `${location.origin}${location.pathname}?share=${currentShareToken}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('구매 견적 링크 복사됨!', 'success');
  } catch(e) {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('구매 견적 링크 복사됨!', 'success');
  }
}
async function copyShareLink() {
  if (!editingQuoteId) { showToast('먼저 저장하세요','error'); return; }
  const url = location.origin+'/quote-view.html?token='+currentShareToken;
  await navigator.clipboard.writeText(url);
  showToast('공유 링크가 복사되었습니다 🔗','success');
}
async function mobileShareQuote() {
  if (!editingQuoteId) { showToast('먼저 저장하세요','error'); return; }
  const url = location.origin+'/quote-view.html?token='+currentShareToken;
  if (navigator.share) {
    try { await navigator.share({ title: '구매 견적서', text: '비유니드 구매 견적서를 확인하세요.', url }); }
    catch(e) { if (e.name !== 'AbortError') showToast('공유 실패: '+e.message,'error'); }
  } else {
    await navigator.clipboard.writeText(url);
    showToast('공유 링크가 복사되었습니다 🔗','success');
  }
}


async function loadHistory() {
  const body = document.getElementById('history-body');
  if (!body) return;
  try {
  const { data, error } = await db.from('quotes').select('*').order('created_at',{ascending:false});
  if (error) { body.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:#ef4444">데이터 로드 오류: '+error.message+'</td></tr>'; return; }
  if (!data?.length) {
    body.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:#94a3b8">저장된 견적이 없습니다</td></tr>';
    return;
  }
  body.innerHTML = data.map(q=>`
    <tr>
      <td style="font-weight:700;color:#1B3A6B;">${q.quote_number}</td>
      <td>${new Date(q.created_at).toLocaleDateString('ko-KR')}</td>
      <td>${q.company_name||''}</td>
      <td>${q.contact_name||''}</td>
      <td style="font-weight:700;">${fmt(q.total)}원</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="loadQuote('${q.id}')">불러오기</button>
        ${q.share_token?`<button class="btn btn-link-copy btn-sm" onclick="copyQuoteLink('${q.share_token}','${q.quote_number}')">링크복사</button>`:''}
        <button class="btn btn-danger btn-sm" onclick="deleteQuote('${q.id}')">삭제</button>
      </td>
    </tr>`).join('');
  } catch(e) {
    if (body) body.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:#ef4444">오류: '+e.message+'</td></tr>';
  }
}

async function loadQuote(qId) {
  const { data: q } = await db.from('quotes').select('*').eq('id',qId).single();
  const { data: items } = await db.from('quote_items').select('*').eq('quote_id',qId).order('sort_order');
  if (!q) return;
  editingQuoteId = qId; currentShareToken = q.share_token; currentQuoteNum = q.quote_number;
  const setV = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
  setV('f-company',q.company_name); setV('f-contact',q.contact_name);
  setV('f-phone',q.contact_tel); setV('f-email',q.contact_email);
  setV('f-delivery',q.delivery_date); setV('f-validity',q.valid_until||'견적일로부터 30일');
  setV('f-memo',q.memo);
  setV('f-sales-name',q.sales_name); setV('f-sales-phone',q.sales_phone);
  setV('f-sales-email',q.sales_email); setV('f-sales-dept',q.sales_dept);
  quoteItems = (items||[]).map(i=>Object.assign({},i));
  renderQuoteItems(); calcPrice();
  // 구매견적 탭으로 이동
  switchTopTab('purchase', document.getElementById('ttab-purchase'));
  document.querySelectorAll('#panel-purchase .sub-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
  document.querySelectorAll('#panel-purchase .sub-panel').forEach((p,i)=>p.classList.toggle('active',i===0));
  showToast('견적을 불러왔습니다', 'success');
}

async function deleteQuote(qId) {
  if (!confirm('견적을 삭제하시겠습니까?')) return;
  await db.from('quote_items').delete().eq('quote_id',qId);
  await db.from('quotes').delete().eq('id',qId);
  showToast('삭제되었습니다','success'); loadHistory();
}

function resetQuote() {
  if (!confirm('견적을 초기화하시겠습니까?')) return;
  quoteItems=[]; editingQuoteId=null; currentShareToken=null;
  renderQuoteItems(); calcPrice();
  ['f-company','f-contact','f-phone','f-email','f-delivery','f-memo'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('f-validity').value='견적일로부터 30일';
  document.getElementById('discount-rate').value=0;
  document.getElementById('discount-amt').value=0;
  initQuoteNum();
  showToast('초기화되었습니다','success');
}

// 구매 제품 관리

async function bulkInsertSampleProducts() {
  if (!confirm('엑셀 기반 샘플 제품 ' + SAMPLE_PRODUCTS.length + '개를 DB에 등록하시겠습니까?\n기존 데이터와 중복될 수 있습니다.')) return;
  showToast('제품 등록 중...', 'info');
  let ok = 0, fail = 0;
  for (const p of SAMPLE_PRODUCTS) {
    const { error } = await db.from('products').insert({
      name: p.name, brand: p.brand, category: p.category,
      spec_summary: p.spec_summary, base_price: 0,
      daily_price: 0, monthly_price: 0, is_active: true
    });
    if (error) fail++; else ok++;
  }
  showToast('등록 완료: 성공 ' + ok + '개 / 실패 ' + fail + '개', ok > 0 ? 'success' : 'error');
  renderAdminProducts(true);
  loadProducts();
  if (typeof rLoadProducts === 'function') rLoadProducts(); else if (typeof rRenderProducts === 'function') { rProducts = SAMPLE_PRODUCTS.map((p,i)=>({...p,id:i+1})); rRenderProducts(); }
}

async function renderAdminProducts(forceRefresh = false) {
  const body = document.getElementById('admin-product-body');
  if (!body) return;
  try {
    let data;
    if (!forceRefresh && products && products.length > 0) {
      // 이미 loadProducts()가 가져온 전역 데이터 재사용 → DB 중복 쿼리 없음
      data = [...products].sort((a,b) => (a.category||'').localeCompare(b.category||'', 'ko'));
    } else {
      const res = await db.from('products').select('*').order('category');
      if (res.error) { body.innerHTML='<tr><td colspan="9" style="text-align:center;padding:20px;color:#ef4444">로드 오류</td></tr>'; return; }
      data = res.data;
      if (data) products = data; // 전역 갱신
    }
    if (!data?.length) { body.innerHTML='<tr><td colspan="9" style="text-align:center;padding:20px;color:#94a3b8">제품 없음</td></tr>'; return; }
    body.innerHTML = data.map(p=>`
      <tr>
        <td style="text-align:center;"><input type="checkbox" class="p-row-check" data-id="${p.id}" onchange="pCheckChange()" style="width:15px;height:15px;cursor:pointer;"></td>
        <td>${p.category}</td>
        <td>${p.brand}</td>
        <td style="font-weight:600;">${p.name}</td>
        <td style="font-size:11px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.spec_summary||''}</td>
        <td style="text-align:center;font-size:13px;">${p.info_url ? '✅' : ''}</td>
        <td style="text-align:right;font-weight:600;">${fmt(p.base_price)}원</td>
        <td style="display:flex;gap:5px;">
          <button class="btn btn-secondary btn-sm" onclick="openProductModal('${p.id}')">수정</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">삭제</button>
        </td>
      </tr>`).join('');
  } catch(e) {
    console.error('renderAdminProducts 오류:', e);
    if (body) body.innerHTML='<tr><td colspan="8" style="text-align:center;color:#ef4444">오류 발생: '+e.message+'</td></tr>';
  }
}

// 관리자 구매 제품 검색 필터

// ===== 견적 이력 검색 =====
function filterHistory() {
  const q = (document.getElementById('p-history-search')?.value||'').toLowerCase();
  const rows = document.querySelectorAll('#history-body tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
}

function filterAdminProducts() {
  const q = (document.getElementById('admin-product-search')?.value||'').toLowerCase();
  document.querySelectorAll('#admin-product-body tr').forEach(tr=>{
    const text = tr.textContent.toLowerCase();
    tr.style.display = !q || text.includes(q) ? '' : 'none';
  });
}
let editingProductId = null;
function openProductModal(pid) {
  editingProductId = pid || null;
  document.getElementById('pm-title').textContent = pid ? '구매 제품 수정' : '구매 제품 추가';
  if (pid) {
    const p = products.find(x=>String(x.id)===String(pid)) || {};
    document.getElementById('pm-name').value = p.name||'';
    document.getElementById('pm-brand').value = p.brand||'HP';
    document.getElementById('pm-category').value = p.category||'노트북';
    document.getElementById('pm-price').value = p.base_price||'';
    document.getElementById('pm-spec').value = p.spec_summary||'';
    const pmFeature = document.getElementById('pm-feature'); if(pmFeature) pmFeature.value = p.feature||'';
    const pmInfoUrl = document.getElementById('pm-info-url'); if(pmInfoUrl) pmInfoUrl.value = p.info_url||'';
  } else {
    ['pm-name','pm-price','pm-spec'].forEach(id=>{document.getElementById(id).value='';});
    const pmInfoUrl = document.getElementById('pm-info-url'); if(pmInfoUrl) pmInfoUrl.value='';
  }
  openModal('modal-product');
}
async function saveProduct() {
  const name = document.getElementById('pm-name').value.trim();
  if (!name) { showToast('제품명을 입력하세요','error'); return; }
  const payload = {
    name, brand: document.getElementById('pm-brand').value,
    category: document.getElementById('pm-category').value,
    base_price: parseInt(document.getElementById('pm-price').value)||0,
    spec_summary: document.getElementById('pm-spec').value,
    feature: document.getElementById('pm-feature')?.value || '',
    info_url: document.getElementById('pm-info-url')?.value.trim() || null,
    is_active: true
  };
  if (editingProductId) {
    await db.from('products').update(payload).eq('id',editingProductId);
  } else {
    await db.from('products').insert(payload);
  }
  try {
    closeModal('modal-product');
    await loadProducts(); renderAdminProducts(true); renderProducts();
    showToast('저장되었습니다','success');
  } catch(e) {
    showToast('저장 중 오류: ' + (e.message||e), 'error');
  }
}
async function deleteProduct(pid) {
  if (!confirm('제품을 삭제하시겠습니까?')) return;
  await db.from('products').delete().eq('id',pid);
  await loadProducts(); renderAdminProducts(true); renderProducts();
  showToast('삭제되었습니다','success');
}

// ===== 구매 제품 체크박스 일괄 삭제 =====
function pToggleAll(cb) {
  document.querySelectorAll('.p-row-check').forEach(c => c.checked = cb.checked);
  pCheckChange();
}
function pCheckChange() {
  const checked = document.querySelectorAll('.p-row-check:checked');
  const btn = document.getElementById('p-bulk-del-btn');
  if (btn) btn.style.display = checked.length > 0 ? '' : 'none';
  const all = document.querySelectorAll('.p-row-check');
  const allCb = document.getElementById('p-check-all');
  if (allCb) allCb.indeterminate = checked.length > 0 && checked.length < all.length;
  if (allCb && checked.length === all.length && all.length > 0) allCb.checked = true;
  if (allCb && checked.length === 0) allCb.checked = false;
}
async function pBulkDelete() {
  const checked = [...document.querySelectorAll('.p-row-check:checked')];
  if (!checked.length) return;
  if (!confirm(`선택한 ${checked.length}개 구매 제품을 삭제하시겠습니까?`)) return;
  const ids = checked.map(c => c.dataset.id);
  const { error } = await db.from('products').delete().in('id', ids);
  if (error) { showToast('삭제 오류: ' + error.message, 'error'); return; }
  showToast(`${ids.length}개 제품이 삭제되었습니다`, 'success');
  await loadProducts(); renderAdminProducts(true); renderProducts();
  document.getElementById('p-check-all').checked = false;
  const btn = document.getElementById('p-bulk-del-btn');
  if (btn) btn.style.display = 'none';
}
