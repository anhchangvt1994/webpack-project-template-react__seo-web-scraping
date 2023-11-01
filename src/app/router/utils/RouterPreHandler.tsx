import { ServerStore } from 'store/ServerStore'
import { resetSeoTag } from 'utils/SeoHelper'

interface IFetchOnRouteResponse {
	originPath: string
	path: string
	search: string | undefined
	status: number
}

const fetchOnRoute = (() => {
	let controller

	return async (
		path: string,
		init?: RequestInit | undefined
	): Promise<undefined | IFetchOnRouteResponse> => {
		if (!path) return

		// controller?.abort('reject')
		controller = new AbortController()

		const data = await new Promise(async (res) => {
			setTimeout(() => {
				// controller?.abort('reject')
				res(null)
			}, 1000)
			const response = await fetch(path, {
				...init,
				signal: controller.signal,
			})
				.then((res) => res.text())
				.catch((err) => {
					console.error(err)
					throw err
				})

			res(/^{(.|[\r\n])*?}$/.test(response) ? JSON.parse(response) : {})
		})

		return data as IFetchOnRouteResponse
	}
})() // fetchOnRoute

const VALID_CODE_LIST = [200]
const REDIRECT_CODE_LIST = [301, 302]
const ERROR_CODE_LIST = [404, 500, 502, 504]

let prevPath = ''
const validPathListCached = new Map<
	string,
	{
		status: number
		path: string
	}
>()

export default function RouterLocaleValidation({ children }) {
	const location = useLocation()
	const { locale } = useParams()
	const localeContext = useLocaleInfo()
	const [element, setElement] = useState<JSX.Element>()
	const enableLocale = useMemo(
		() => Boolean(LocaleInfo.langSelected || LocaleInfo.countrySelected),
		[]
	)

	useLayoutEffect(() => {
		// console.log('start router pre handle')
		const curLocale = getLocale(
			LocaleInfo.langSelected,
			LocaleInfo.countrySelected
		)

		const validPathInfo = (() => {
			let tmpValidPathInfo

			tmpValidPathInfo = validPathListCached.get(location.pathname)

			if (tmpValidPathInfo) return tmpValidPathInfo
			tmpValidPathInfo = validPathListCached.get(
				location.pathname.replace(`/${locale}`, '')
			)

			return tmpValidPathInfo
		})()

		if (!BotInfo.isBot && !validPathInfo) {
			// console.log('fetch')
			const fullPath = `${location.pathname}${
				location.search
					? location.search + '&key=' + Date.now()
					: '?key=' + Date.now()
			}`

			fetchOnRoute(fullPath, {
				method: 'GET',
				headers: new Headers({
					Accept: 'application/json',
				}),
			}).then((res) => {
				// NOTE - Handle pre-render for bot with locale options turned on

				if (enableLocale) {
					ServerStore.reInit.LocaleInfo()

					localeContext.setLocaleState({
						lang: LocaleInfo.langSelected,
						country: LocaleInfo.countrySelected,
					})
				}

				if (res) {
					if (REDIRECT_CODE_LIST.includes(res.status)) {
						if (location.search === res.search) {
							validPathListCached.set(
								res.originPath.replace(`/${curLocale}`, '') || '/',
								{
									status: res.status,
									path: res.path,
								}
							)
						}

						setElement(
							<Navigate to={(res.path + res.search) as string} replace />
						)
					} else {
						const tmpPath =
							location.pathname.replace(`/${curLocale}`, '') || '/'
						validPathListCached.set(tmpPath, {
							status: res.status,
							path: tmpPath,
						})

						setElement(children)
					}
				} else {
					setElement(children)
				}
			})
		} else if (
			enableLocale &&
			validPathInfo &&
			location.pathname.replace(`/${locale}`, '') ===
				prevPath.replace(`/${curLocale}`, '')
		) {
			const arrLocale = location.pathname.split('/')[1]?.split('-')

			if (arrLocale?.length) {
				const cookies = getCookie('LocaleInfo')
				if (LocaleInfo.defaultLang) setCookie('lang', arrLocale[0])
				if (LocaleInfo.defaultCountry)
					setCookie(
						'country',
						LocaleInfo.defaultLang ? arrLocale[1] : arrLocale[0]
					)

				if (cookies) {
					const objCookies = JSON.parse(cookies)
					objCookies.langSelected = getCookie('lang')
					objCookies.countrySelected = getCookie('country')
					setCookie('LocaleInfo', JSON.stringify(objCookies))
				}

				ServerStore.reInit.LocaleInfo()

				localeContext.setLocaleState({
					lang: LocaleInfo.langSelected,
					country: LocaleInfo.countrySelected,
				})
			}

			setElement(children)
		} else if (
			enableLocale &&
			validPathInfo &&
			validPathInfo.status !== 200 &&
			!location.pathname.startsWith(`/${curLocale}`)
		) {
			// console.log('change local with cache')
			setElement(
				<Navigate
					to={
						`/${curLocale}${
							validPathInfo.path === '/' ? '' : validPathInfo.path
						}` as string
					}
					replace
				/>
			)
		} else setElement(children)

		prevPath = location.pathname

		// resetSeoTag()
	}, [location.pathname])

	return element
}
