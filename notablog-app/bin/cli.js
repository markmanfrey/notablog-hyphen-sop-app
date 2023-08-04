#!/usr/bin/env node

const { FlagTypes, parseArgv, parseFlagVal } = require('@dnpr/cli')
const { Logger } = require('@dnpr/logger')
const React = require('react','useContext');

const { generate, preview, MyComponent } = require('../dist/index')

function printHelp() {
  console.log(`\
Usage: noteablog-app <command> [<option>]

Available <command>:
  help                                 Show this text.
  generate <path_to_noteablog-app-starter>  Generate the blog.
  preview <path_to_noteablog-app-starter>   Open a browser to preview the blog.

Available <option>:
  -v, --verbose  Print more messages for debugging.
  --fresh        Generate without cache. Useful when you get stalled result
                 after upgrading.
  
Note:
  If you have just updated noteablog-app, don't forget to also update 
  noteablog-app-starter (https://github.com/dragonman225/noteablog-app-starter), 
  or layout may be broken due to mismatch between the generated HTML and 
  the CSS theme.`)
}

async function cmdGenerate(opts, logger) {
  if (!opts.workDir) {
    console.log('You must specify the path to a noteablog-app-starter to generate.')
    process.exit(1)
  }
  if (!opts.pageIdToPublish) {
    console.log('You must specify a Notion page ID to publish.')
    process.exit(2)
  }

  try {
    const startTime = Date.now()
    await generate(opts.workDir, opts.pageIdToPublish, opts)
    const endTime = Date.now()
    const timeElapsed = (endTime - startTime) / 1000
    //logger.info(`Done in ${timeElapsed}s. Run 'noteablog-app preview ${opts.workDir}' to preview`)
  } catch (error) {
    logger.error(error)
  }
}

function cmdPreview(workDir, logger) {
  if (!workDir) {
    console.log('You must specify the path to a noteablog-app-starter to preview.')
    process.exit(1)
  }

  try {
    preview(workDir)
  } catch (error) {
    logger.error(error)
  }
}

async function main() {
  const { args, flags } = parseArgv(process.argv)
  const verbose = parseFlagVal(
    flags,
    '(-v|--verbose)',
    FlagTypes.boolean,
    false
  )
  const ignoreCache = parseFlagVal(flags, '--fresh', FlagTypes.boolean, false)
  const subCmd = args[0]
  const workDir = args[1]
  const pageIdToPublish = args[2]
  const logger = new Logger('noteablog-app-cli', {
    logLevel: verbose ? 'debug' : 'info',
    useColor: process.env.NO_COLOR ? false : true,
  })

  if (!subCmd) {
    printHelp()
    return
  }

  switch (subCmd) {
    case 'help':
      printHelp()
      break
    case 'generate': {
      const opts = {
        concurrency: 3,
        verbose,
        workDir,
        ignoreCache,
        pageIdToPublish,
      }
      cmdGenerate(opts, logger)
      break
    }
    case 'preview':
      cmdPreview(workDir, logger)
      break
    default:
      logger.error(`'${subCmd}' is not a valid command. See 'noteablog-app help'`)
  }
}

main()
