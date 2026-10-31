import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FixedInformation } from '../components/FixedInformation'
import { Icon } from '../components/Icon'
import styles from '../components/ui.module.css'
export type FieldProps = {
  id: string
  label: string
  optional?: boolean
  hint?: string
  wide?: boolean
  children: ReactNode
}
function Field({ id, label, children, wide, optional, hint }: FieldProps) {
  return (
    <div className={wide ? styles.wideField : styles.field}>
      <label htmlFor={id}>
        {label}{' '}
        {optional ? (
          <span className={styles.optional}>(không bắt buộc)</span>
        ) : (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span className={styles.hint} id={`${id}-hint`}>
          {hint}
        </span>
      )}
      
    </div>
  )
}
export function CreateQuotation() { return (
    <>
      <Link className={styles.backLink} to="/quotations">
        <Icon name="back" size={17} />
        Danh sách bản chào
      </Link>
      <div className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>BẢN CHÀO MỚI</p>
          <h1>Tạo bản chào bảo hiểm</h1>
          <p className={styles.subtitle}>
            Nhập thông tin khách hàng và tài sản để tính phí, tạo bản chào.
          </p>
        </div>
      </div>
      <FixedInformation />
      <form
        
        noValidate
        
        
      >
        <fieldset className={styles.formFieldset} disabled>
          <legend className={styles.srOnly}>Thông tin tạo bản chào</legend>
          <div className={styles.formLayout}>
            <div className={styles.formSections}>
              <section className={styles.card} aria-labelledby="customer-heading">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>01</span>
                  <h2 id="customer-heading">Thông tin khách hàng</h2>
                  <span className={styles.cardHint}>* Bắt buộc</span>
                </div>
                <div className={styles.fields}>
                  <Field id="customerName" label="Tên khách hàng"  wide>
                    <input
                      id="customerName" name="customerName" readOnly
                      required
                      maxLength={150}
                      autoComplete="organization"
                      placeholder="Nhập tên cá nhân hoặc tổ chức"
                    />
                  </Field>
                  <Field id="phone" label="Điện thoại" optional >
                    <input
                      id="phone" name="phone" readOnly
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Ví dụ: 0901234567"
                    />
                  </Field>
                  <Field id="email" label="Email" optional >
                    <input
                      id="email" name="email" readOnly
                      type="email"
                      autoComplete="email"
                      placeholder="ten@example.com"
                    />
                  </Field>
                </div>
              </section>
              <section className={styles.card} aria-labelledby="asset-heading">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>02</span>
                  <h2 id="asset-heading">Thông tin tài sản</h2>
                </div>
                <div className={styles.fields}>
                  <Field id="assetName" label="Tên/mô tả tài sản"  wide>
                    <input
                      id="assetName" name="assetName" readOnly
                      required
                      maxLength={200}
                      placeholder="Ví dụ: Kho hàng, văn phòng…"
                    />
                  </Field>
                  <Field id="address" label="Địa chỉ tài sản"  wide>
                    <textarea
                      id="address" name="address" readOnly
                      required
                      rows={2}
                      maxLength={300}
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                    />
                  </Field>
                  <Field
                    id="sumInsured"
                    label="Số tiền bảo hiểm"
                    
                    hint="Từ 1.000.000 đến 100.000.000.000 VND."
                    wide
                  >
                    <div className={styles.inputWithUnit}>
                      <input
                        id="sumInsured" name="sumInsured" readOnly
                        required
                        inputMode="numeric"
                        placeholder="Ví dụ: 1000000000"
                      />
                      <span aria-hidden="true">VND</span>
                    </div>
                  </Field>
                </div>
              </section>
              
            </div>
            
          </div>
          
          <p className={styles.liveNotice} role="status">
            Trình bày tĩnh: chỉ các trường đã xây ở mốc này. Bước 2 mới nối dữ liệu.</p>
          
        </fieldset>
      </form>
      
    </>
  ) }
