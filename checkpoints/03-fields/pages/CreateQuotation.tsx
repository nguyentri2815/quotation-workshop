import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FixedInformation } from '../components/FixedInformation'
import { Icon } from '../components/Icon'
import styles from '../components/ui.module.css'
function Field({
  id,
  label,
  optional,
  error,
  hint,
  wide,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  error?: string
  hint?: string
  wide?: boolean
  children: ReactNode
}) {
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
      {error && (
        <span className={styles.fieldError} id={`${id}-error`}>
          {error}
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
              <section className={styles.card} aria-labelledby="period-heading">
                <div className={styles.cardHeading}>
                  <span className={styles.sectionNumber}>03</span>
                  <h2 id="period-heading">Thời hạn bảo hiểm</h2>
                  <span className={styles.cardHint}>Tối đa 365 ngày</span>
                </div>
                <div className={styles.fields}>
                  <Field id="startDate" label="Ngày bắt đầu" >
                    <input id="startDate" name="startDate" readOnly type="date" required />
                  </Field>
                  <Field id="endDate" label="Ngày kết thúc" >
                    <input id="endDate" name="endDate" readOnly type="date" required />
                  </Field>
                </div>
              </section>
            </div>
            <aside className={styles.premiumAside}>
              <section className={styles.card} aria-labelledby="premium-heading"><h2 id="premium-heading">Kết quả phí</h2><p>Chưa có kết quả phí. Vùng trình bày và tính phí được xây ở bước 3.</p></section>
              <div className={styles.sampleCard}>
                <Icon name="spark" />
                <div>
                  <strong>Thử nhanh với dữ liệu mẫu</strong>
                  <p>Điền sẵn một khách hàng, một tài sản và thời hạn 365 ngày.</p>
                  <button
                    type="button"
                    className={styles.textButton}
                    
                  >
                    Điền dữ liệu mẫu <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            </aside>
          </div>
          
          <p className={styles.liveNotice} role="status">
            Màn hình tĩnh: đủ trường và vùng phí; nhập liệu bắt đầu ở bước 2.
          </p>
          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.secondaryButton}
              
            >
              Hủy
            </button>
            <div className={styles.actionGroup}>
              <button type="button" className={styles.secondaryButton} >
                Tính phí
              </button>
              <button type="submit" className={styles.primaryButton} disabled>
                Lưu bản chào
              </button>
            </div>
          </div>
        </fieldset>
      </form>
      
    </>
  ) }
