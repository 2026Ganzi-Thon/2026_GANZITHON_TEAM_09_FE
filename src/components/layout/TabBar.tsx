import { NavLink } from 'react-router-dom'
import groupIcon from '../../assets/icons/tab-group.svg'
import helpIcon from '../../assets/icons/tab-help.svg'
import myIcon from '../../assets/icons/tab-my.svg'
import recordsIcon from '../../assets/icons/tab-records.svg'
import styles from './TabBar.module.css'

const TABS = [
  { to: '/groups', label: '그룹', icon: groupIcon },
  { to: '/records', label: '내 기록', icon: recordsIcon },
  { to: '/help', label: '도움받기', icon: helpIcon },
  { to: '/my', label: '마이', icon: myIcon },
]

/** Figma TabBar: 활성=그룹 / 내 기록 / 도움받기 / 마이. 아이콘은 mask로 색을 바꾼다. */
export function TabBar() {
  return (
    <nav className={styles.bar} aria-label="주요 메뉴">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          <span
            className={styles.icon}
            style={{ maskImage: `url("${tab.icon}")`, WebkitMaskImage: `url("${tab.icon}")` }}
            aria-hidden
          />
          <span className={styles.label}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
