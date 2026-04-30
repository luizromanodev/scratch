import './Skeleton.css'

export function Skeleton({ width, height, radius, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '16px',
        borderRadius: radius || 'var(--radius-md)',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-row">
        <Skeleton width="42px" height="42px" radius="var(--radius-md)" />
        <div className="skeleton-card-info">
          <Skeleton width="65%" height="14px" />
          <Skeleton width="40%" height="10px" />
        </div>
        <Skeleton width="70px" height="14px" />
      </div>
    </div>
  )
}

export function SkeletonBalanceCard() {
  return (
    <div className="skeleton-balance">
      <Skeleton width="100px" height="12px" className="skeleton-light" />
      <Skeleton width="180px" height="32px" className="skeleton-light" />
      <div className="skeleton-balance-row">
        <div className="skeleton-balance-item">
          <Skeleton width="28px" height="28px" radius="50%" className="skeleton-light" />
          <div>
            <Skeleton width="60px" height="10px" className="skeleton-light" />
            <Skeleton width="80px" height="14px" className="skeleton-light" />
          </div>
        </div>
        <div className="skeleton-balance-item">
          <Skeleton width="28px" height="28px" radius="50%" className="skeleton-light" />
          <div>
            <Skeleton width="60px" height="10px" className="skeleton-light" />
            <Skeleton width="80px" height="14px" className="skeleton-light" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="skeleton-chart">
      <Skeleton width="140px" height="140px" radius="50%" />
      <div className="skeleton-chart-legend">
        <Skeleton width="100%" height="12px" />
        <Skeleton width="80%" height="12px" />
        <Skeleton width="90%" height="12px" />
      </div>
    </div>
  )
}

export function SkeletonTransactionList({ count = 3 }) {
  return (
    <div className="skeleton-tx-list">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
