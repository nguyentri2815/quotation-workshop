import { checkpointById } from '../../workshop/catalog'
import type { ComponentChange, ChangeKind, ChangeSource } from '../../workshop/change-model'
import { revisionCheckpoints } from './revision'
export const comparison={baseline:checkpointById('12'),target:revisionCheckpoints.at(-1)!}
const f='pages/CreateQuotation.tsx',r='quotation/rules.ts',p='quotation/products.ts',v='components/ProductInformation.tsx'
const loc=(file:string,symbol:string):ChangeSource=>({file,symbol})
const form=(name:string)=>loc(f,'CreateQuotation.'+name)
const rule=(name:string)=>loc(r,name)
const create=(id:string,kind:ChangeKind,before:string,after:string,reason:string,beforeSources:ChangeSource[],afterSources:ChangeSource[]):ComponentChange=>({id,kind,before,after,reason,beforeSources,afterSources})
// Stable semantic IDs, explicitly matched across renames/moves. Line ranges
// are resolved from each pinned revision, never used as correspondence keys.
export const changes:Record<string,ComponentChange>={
 catalog:create('product.catalog','new','Một sản phẩm A cố định.','Catalog A/B với mã, phiên bản, giới hạn và tỷ lệ.','Dùng chung dữ liệu cho lựa chọn, validation, phí và snapshot.',[],[loc(p,'propertyProducts')]),
 contract:create('product.contract','new','Chưa có contract catalog.','PropertyProduct mô tả hai sản phẩm.','Định danh và giới hạn có kiểu dùng chung.',[],[loc(p,'PropertyProduct')]),
 lookup:create('product.lookup','new','Không tra sản phẩm.','Tra đúng mã/phiên bản; mã lạ bị từ chối.','Không mặc định mã lạ thành A.',[],[loc(p,'getPropertyProduct')]),
 cards:create('product.selection-page','new','Mở form A trực tiếp.','Chọn sản phẩm ở /products trước form.','Tạo đúng ngữ cảnh ngay từ đầu.',[],[loc('pages/SelectProduct.tsx','SelectProduct')]),
 entry:create('app.product-entry','changed','Route /quotations/new mở CreateQuotation.','QuotationEntry kiểm URL, thiếu mã về /products; mã lạ hiện lỗi; initialCode vào form.','Chỉ mở form khi biết sản phẩm.',[loc('App.tsx','router')],[loc('App.tsx','router'),loc('pages/SelectProduct.tsx','QuotationEntry')]),
 selection:create('form.product-state','new','Không có state mã sản phẩm.','productCode sở hữu lựa chọn đã áp dụng.','Một form cho hai sản phẩm.',[],[form('productCode')]),
 selected:create('form.product-consumer','new','Tên/giới hạn A viết cố định.','Tìm sản phẩm theo mã trong catalog.','Presentation và rules cùng ngữ cảnh.',[],[form('product')]),
 'product-props':create('form.product-props','new','FixedInformation không nhận sản phẩm.','Truyền product và onProductChange.','Form sở hữu lựa chọn, presentation phát intent.',[],[form('props.ProductInformation')]),
 'product-view':create('product.context','new','FixedInformation trình bày thông tin A.','Ngữ cảnh gọn và Chi tiết sản phẩm; panel chọn ứng viên.','Catalog nằm ở /products; nội dung học nằm ở Workshop.',[],[loc(v,'ProductInformation')]),
 candidate:create('product.panel-candidate','new','Không có bước xác nhận đổi.','Panel giữ candidate cục bộ; Hủy/Escape không đổi form/phí.','Chỉ xác nhận mới gọi callback.',[],[loc(v,'ProductInformation.candidate'),loc(v,'ProductInformation')]),
 change:create('form.confirm-product','new','Không có đổi sản phẩm.','Guard mã trùng/đang lưu; giữ draft, đổi mã, bỏ phí, kiểm lại lỗi.','Không dùng phí của sản phẩm trước.',[],[form('changeProduct')]),
 draft:create('form.draft','unchanged','Draft tám trường của khách hàng/tài sản/thời hạn.','Giữ tám trường và nơi sở hữu draft.','Không nhân đôi form hay ép dữ liệu khi đổi.',[form('draft')],[form('draft')]),
 form:create('form.shared-container','changed','Một form cho sản phẩm A cố định.','Một form nhận initialCode, truyền ngữ cảnh và xử lý đổi sản phẩm.','Giữ draft và bố cục dùng chung.',[loc(f,'CreateQuotation')],[loc(f,'CreateQuotation')]),
 edit:create('form.edit-draft','changed','Sửa tiền/ngày bỏ phí; sửa tên giữ phí, xóa lỗi trường sửa.','Giữ policy ba đầu vào; sau validation kiểm lại lỗi theo sản phẩm.','Giữ lỗi phù hợp với ngữ cảnh mới.',[form('updateDraft'),form('inputProps')],[form('updateDraft'),form('inputProps')]),
 build:create('validation.normalize-input','changed','Chuẩn hóa input A.','Input có mã và phiên bản sản phẩm được chọn.','Dữ liệu gửi giữ đúng ngữ cảnh.',[rule('validateAndBuildInput')],[rule('validateAndBuildInput')]),
 validate:create('validation.product-limits','changed','Giới hạn A cố định 1 triệu–100 tỷ / 365 ngày.','Tra catalog: B 10 triệu–50 tỷ / tối đa180 ngày; giữ lỗi chung và ngày lịch.','Hints và validation cùng quy tắc.',[rule('validateDraft')],[rule('validateDraft'),loc(p,'getPropertyProduct')]),
 validated:create('form.validation-consumer','changed','validatedInput gọi chuẩn hóa draft A.','Truyền productCode, lưu trạng thái đã validation; lỗi/focus dùng lại.','Validation chạy đúng sản phẩm.',[form('validatedInput')],[form('validatedInput')]),
 calculate:create('form.calculate','changed','validatedInput → calculatePremium A.','validatedInput theo mã → calculateDraftPremium.','Nối quy tắc sản phẩm và receipt.',[form('calculate')],[form('calculate')]),
 formula:create('pricing.formula','changed','Tỷ lệ A 0,001; thuế0,1, giới hạn cố định.','Tra catalog; cùng net=round(sum×rate×days/365), tax=round(net×taxRate).','Thay nguồn tham số, giữ ngày lịch và thứ tự làm tròn.',[rule('calculatePremium')],[rule('calculatePremium')]),
 receipt:create('pricing.receipt','new','Premium chỉ có kết quả phí.','Gắn code/version/tiền/hai ngày đã tính.','Kiểm phí thuộc đúng sản phẩm và đầu vào.',[],[rule('calculateDraftPremium')]),
 result:create('form.premium-state','changed','State Premium | null.','State CalculatedPremium | null có receipt.','Kết quả có định danh nguồn tính.',[form('premium')],[form('premium')]),
 matches:create('pricing.receipt-match','new','Hiệu lực dựa vào việc sửa ba đầu vào.','So mã, phiên bản và ba đầu vào trước trình bày/lưu.','Bổ sung bảo vệ đổi sản phẩm/phiên bản.',[],[rule('premiumMatchesDraft')]),
 current:create('form.current-premium','new','Render/lưu trực tiếp premium.','currentPremium chỉ dùng receipt còn khớp.','Tránh hiển thị/lưu phí cũ.',[],[form('currentPremium')]),
 directPremium:create('pricing.direct-presentation','removed','Sau cập nhật draft, JSX truyền trực tiếp premium vào PremiumSummary.','Đường trình bày đi qua currentPremium và kiểm receipt.','Thay cạnh trực tiếp bằng bước kiểm mã/phiên bản/đầu vào trước trình bày.',[form('props.PremiumSummary')],[]),
 summary:create('pricing.presentation','changed','Hiện kết quả A và tỷ lệ cố định.','Hiện sản phẩm/phiên bản receipt và tỷ lệ theo sản phẩm.','Presentation vẫn không tính phí.',[loc('components/PremiumSummary.tsx','PremiumSummary')],[loc('components/PremiumSummary.tsx','PremiumSummary')]),
 save:create('form.save','changed','Chống gửi lặp; validation A, !premium → dừng; POST input A.','Giữ async/retry; input mã/phiên bản và guard currentPremium.','Không lưu sản phẩm với phí không khớp.',[form('save')],[form('save')]),
 client:create('api.contract-reader','changed','POST/GET đọc response bằng parser A.','Dùng parser lịch sử và phản hồi danh sách kèm số row lỗi.','Giữ transport nhưng thay contract đọc.',[loc('api/quotations.ts','quotationsApi')],[loc('api/quotations.ts','quotationsApi')]),
 'parse-input':create('api.input-contract','changed','Chỉ BASIC_PROPERTY.','Bắt buộc mã A/B và version1; validation theo mã.','Không tin tên/rate/tổng từ client.',[rule('parseQuotationInput')],[rule('parseQuotationInput')]),
 create:create('storage.create','changed','Tính lại A và lưu record cũ.','Lookup code/version, tính lại và lưu schema2 + productSnapshot.','Giữ giá trị đã phát hành.',[loc('mocks/storage.ts','createQuotation')],[loc('mocks/storage.ts','createQuotation')]),
 terms:create('storage.issued-terms','new','Không có snapshot điều khoản.','Chụp điều khoản/rate/dayBasis/rounding.','Đọc lịch sử độc lập catalog đang hoạt động.',[],[loc(p,'productTerms')]),
 record:create('storage.record-parser','changed','parseQuotation trong rules kiểm/tính bằng A hiện tại.','Chuyển sang records.ts; kiểm snapshot lịch sử, adapter hẹp A gốc.','Đổi file vẫn cùng trách nhiệm đọc record; không tái báo giá.',[rule('parseQuotation')],[loc('quotation/records.ts','parseQuotation')]),
 report:create('storage.read-report','changed','Một row sai làm đọc cả danh sách thất bại.','Cách ly row sai, trả số skipped; giữ byte gốc.','Đọc được row hợp lệ mà không mất dữ liệu.',[loc('mocks/storage.ts','readQuotations')],[loc('mocks/storage.ts','readQuotationReport')]),
 list:create('read.list','changed','Hiện danh sách A.','Hiện sản phẩm đã lưu và cảnh báo row lỗi.','Đọc từ dữ liệu phát hành.',[loc('pages/QuotationList.tsx','QuotationList')],[loc('pages/QuotationList.tsx','QuotationList')]),
 detail:create('read.detail','changed','Hiện thông tin/phí A.','Hiện sản phẩm/phiên bản và biểu phí snapshot.','Reload không phụ thuộc state form.',[loc('pages/QuotationDetail.tsx','QuotationDetail')],[loc('pages/QuotationDetail.tsx','QuotationDetail')]),
 leave:create('form.leave','unchanged','Blocker và dialog khi dirty; beforeunload cho reload; cho rời sau lưu.','Giữ blocker, dirty, allowLeave và dialog/Escape.','Không thay hành vi rời form.',[form('blocker'),form('dirty')],[form('blocker'),form('dirty')]),
 fixed:create('product.fixed-context','removed','FixedInformation nằm trên form với A cố định.','Form dùng ProductInformation gọn và ngữ cảnh từ lựa chọn.','Thay thành phần cố định; chỉ giữ ở so sánh/lưu trữ.',[loc('components/FixedInformation.tsx','FixedInformation')],[]),
}
// These are semantic decisions verified against both pinned implementations.
// An unchanged event can live in a changed flow; wrappers do not decide the label.
export const flowKinds:Record<string,ChangeKind>={product:'new','input-edit':'changed',calculate:'changed',save:'changed',read:'changed',leave:'unchanged'}
export const eventChangeKeys:Record<string,Record<string,string>>={
 'input-edit':{input:'edit',draft:'edit',update:'edit',render:'current',matches:'matches'},
 calculate:{calculate:'calculate',validate:'validate',premium:'formula',state:'result',render:'summary'},
 save:{guard:'save',persist:'create',handler:'parse-input',response:'record'},
 read:{get:'record',data:'detail',isolated:'report'},
 product:{intent:'cards',choose:'cards',panel:'candidate',decision:'candidate',cancel:'candidate',change:'change',same:'change',invalidate:'change',render:'product-view','fixed-context':'fixed'},
}
export function eventChange(flow:string,event:string,sources:ChangeSource[]):ComponentChange {
 const key=eventChangeKeys[flow]?.[event]
 if(key)return changes[key]
 return create('flow.'+flow+'.'+event,'unchanged','Hành vi này có trong Chặng 1 hoàn chỉnh.','Giữ hành vi và điều kiện tương ứng.','Đối chiếu source hai mốc; thay đổi trong flow được đánh dấu ở các điểm khác.',sources,sources)
}
export const requirements=[
 {id:'choice',title:'Chọn sản phẩm',keys:['catalog','cards','entry','product-view','candidate','change'],nodes:['catalog','model','entry','form'],checkpoint:'s2-r3-entry',key:'entry'},
 {id:'validation',title:'Validation theo sản phẩm',keys:['validate','build','validated'],nodes:['catalog','validation','form'],checkpoint:'s2-r3-validation',key:'validate'},
 {id:'pricing',title:'Tính phí theo sản phẩm',keys:['formula','receipt','summary'],nodes:['catalog','pricing','form','model'],checkpoint:'s2-r3-pricing',key:'formula'},
 {id:'consistency',title:'Đổi sản phẩm và hiệu lực phí',keys:['change','edit','matches','current','directPremium'],nodes:['catalog','form','pricing'],checkpoint:'s2-r3-pricing',key:'matches'},
 {id:'history',title:'Lưu / đọc sản phẩm và phiên bản',keys:['save','parse-input','create','terms','record','report','list','detail'],nodes:['model','form','client','mock','storage','pricing','read','catalog'],checkpoint:'s2-r3-complete',key:'record'},
]
export const partChangeKeys:Record<string,string>={entry:'entry',model:'build',form:'form',validation:'validate',pricing:'formula',client:'client',mock:'parse-input',storage:'create',read:'record',catalog:'catalog'}
