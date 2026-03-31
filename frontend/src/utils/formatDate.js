import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
dayjs.locale('vi')

export const formatDate = (date, fmt = 'DD/MM/YYYY') => dayjs(date).format(fmt)
export const formatDateTime = (date) => dayjs(date).format('HH:mm DD/MM/YYYY')
export const fromNow = (date) => dayjs(date).fromNow()
