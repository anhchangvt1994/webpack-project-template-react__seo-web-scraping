'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj }
}
var _fs = require('fs')
var _fs2 = _interopRequireDefault(_fs)
var _path = require('path')
var _path2 = _interopRequireDefault(_path)
var _workerpool = require('workerpool')
var _workerpool2 = _interopRequireDefault(_workerpool)
var _constants = require('../../constants')
var _ConsoleHandler = require('../../utils/ConsoleHandler')
var _ConsoleHandler2 = _interopRequireDefault(_ConsoleHandler)

var _utils = require('./Cache.worker/utils')

const MAX_WORKERS = process.env.MAX_WORKERS
	? Number(process.env.MAX_WORKERS)
	: 7

const CacheManager = () => {
	const get = async (url) => {
		const pool = _workerpool2.default.pool(
			_path2.default.resolve(
				__dirname,
				`./Cache.worker/index.${_constants.resourceExtension}`
			),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			const result = await pool.exec('get', [url])
			return result
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // get

	const achieve = async (url) => {
		if (!url) {
			_ConsoleHandler2.default.error('Need provide "url" param!')
			return
		}

		const key = _utils.getKey.call(void 0, url)
		let file = `${_constants.pagesPath}/${key}.html`
		let isRaw = false

		if (!_fs2.default.existsSync(file)) {
			file = `${_constants.pagesPath}/${key}.raw.html`
			isRaw = true
		}

		if (!_fs2.default.existsSync(file)) return

		const info = await _utils.getFileInfo.call(void 0, file)

		if (!info || info.size === 0) return

		await _utils.setRequestTimeInfo.call(void 0, file, new Date())

		return {
			file,
			response: file,
			status: 200,
			createdAt: info.createdAt,
			updatedAt: info.updatedAt,
			requestedAt: new Date(),
			ttRenderMs: 200,
			available: true,
			isInit: false,
			isRaw,
		}
	} // achieve

	const set = async (params) => {
		const pool = _workerpool2.default.pool(
			_path2.default.resolve(
				__dirname,
				`./Cache.worker/index.${_constants.resourceExtension}`
			),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			const result = await pool.exec('set', [params])
			return result
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // set

	const remove = async (url) => {
		const pool = _workerpool2.default.pool(
			_path2.default.resolve(
				__dirname,
				`./Cache.worker/index.${_constants.resourceExtension}`
			),
			{
				minWorkers: 1,
				maxWorkers: MAX_WORKERS,
			}
		)

		try {
			await pool.exec('remove', [url])
		} catch (err) {
			_ConsoleHandler2.default.error(err)
			return
		} finally {
			pool.terminate()
		}
	} // remove

	return {
		achieve,
		get,
		set,
		remove,
	}
}

exports.default = CacheManager
