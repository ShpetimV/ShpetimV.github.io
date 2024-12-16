/**
 *  SuiWeb 
 *  Simple User Interface Tool for Web Exercises
 *  
 *  Current version: 
 *  1.1.0a6 / 01.12.2024
 *
 *  1.1.0 - modernized version now based on code by Zachary Lee:
 *        - https://webdeveloper.beehiiv.com/p/build-react-400-lines-code
 *        - https://github.com/ZacharyL2/mini-react
 *  
 *  1.1a1 - added code for SJDON processing (bkrt 18.08.2024)
 *        - some open issues
 *  1.1a2 - fixed some issues concerning SJDON processing (19.08.2024)
 *        - introduced decorator useSJDON
 *        - todo: more tests 
 *  1.1a3 - added function combineStyles (19.08.2024)
 *  1.1a4 - enhanced version of combineStyles (20.08.2024)
 *        - combineStyles automatically invoked in parseSJDON
 *  1.1a5 - undefined first element in SJDON is interpreted as Fragment
 *  1.1a6 - combineStyles improved (01.12.2024)
 *
 *  1.0.0 - version by Timo Siegenthaler and Simon Schuhmacher
 *        - https://suiweb.github.io/
 *        - https://github.com/suiweb/suiweb/blob/main/README.md
 * 
 *  0.x.x - first quick and dirty implementations (bkrt 2021/2022)
 *        - based on ideas and code from Rodrigo Pombo: Build your own React
 *        - https://pomb.us/build-your-own-react/
 *
 *  Thanks to Rodrigo Pombo for a great tutorial and for sharing the 
 *  code of the Didact library
 *
 *  0.3.4 - only null or undefined qualify as uninitialized state
 *  0.3.3 - parseSJDON rewritten to use createElement
 *        - flatten children array for props.children in JSX
 *  0.3.2 - save and restore of active element improved 
 *  0.3.1 - parseSJDON rewritten 
 *  0.3.0 - style property 
 *  0.2.3 - ES6 modules
 *  0.2.2 - component state and hooks
 *  0.2.1 - parse SJDON rewritten, function components 
 *  0.2.0 - render single SJDON structures to DOM
 */

let wipRoot = null
let nextUnitOfWork = null
let currentRoot = null
let deletions = []
let wipFiber
let hookIndex = 0

// Support React.Fragment syntax.
const Fragment = Symbol.for('react.fragment')
// Enhanced requestIdleCallback.

{((global) => {
    const id = 1
    const fps = 1e3 / 60
    let frameDeadline
    let pendingCallback
    const channel = new MessageChannel()
    const timeRemaining = () => frameDeadline - window.performance.now();
    const deadline = {
        didTimeout: false,
        timeRemaining,
    }
    channel.port2.onmessage = () => {
        if (typeof pendingCallback === 'function') {
            pendingCallback(deadline)
        }
    }
    global.requestIdleCallback = (callback) => {
        global.requestAnimationFrame((frameTime) => {
            frameDeadline = frameTime + fps
            pendingCallback = callback
            channel.port1.postMessage(null)
        })
        return id
    }
})(window)}

const isDef = (param) =>
  param !== undefined && param !== null

const isPlainObject = (val) =>
  Object.prototype.toString.call(val) === '[object Object]' &&
  [Object.prototype, null].includes(Object.getPrototypeOf(val))

// Simple judgment of virtual elements.
const isVirtualElement = (e) =>
  typeof e === 'object' // && !Array.isArray(e)

// Text elements require special handling.
const createTextElement = (text) => ({
  type: 'TEXT',
  props: {
    nodeValue: text,
  },
  sjdon: "noprops",
})

// Create custom JavaScript data structures.

// const createElement = (type, props = {}, ...child) => {
//   const children = child.map((c) =>
//     isVirtualElement(c) ? c : createTextElement(String(c))
//   )
//   console.log(type)
//   return {
//     type,
//     props: {
//       ...props,
//       children,
//     },
//   }
// }

function createElement(type, props={}, ...children) {
      // console.log("type:")
      // console.log(type)
      // console.log("props:")
      // console.log(props)
      // console.log("children:")
      // console.log(children)
  let res = {
    type,
    props: {
      ...props,
      children: children.flat().map(child =>
        typeof child === "object"
          ? child
          : createTextElement(String(child))
      ),
    },
    sjdon: "noprops",
  }
  // console.log(res)
  return res
}


// Update DOM properties.
// For simplicity, we remove all the previous properties and add next properties.
const updateDOM = (DOM, prevProps, nextProps) => {
  const defaultPropKeys = 'children'

  for (const [removePropKey, removePropValue] of Object.entries(prevProps)) {
    if (removePropKey.startsWith('on')) {
      DOM.removeEventListener(
        removePropKey.slice(2).toLowerCase(),
        removePropValue
      )
    } else if (removePropKey !== defaultPropKeys) {
      // @ts-expect-error: Unreachable code error
      DOM[removePropKey] = ''
    }
  }

  for (const [addPropKey, addPropValue] of Object.entries(nextProps)) {
    if (addPropKey.startsWith('on')) {
      DOM.addEventListener(
        addPropKey.slice(2).toLowerCase(),
        addPropValue
      )
    } else if (addPropKey !== defaultPropKeys) {
      // console.log(addPropKey)
      // console.log(addPropValue)
      DOM[addPropKey] = addPropValue
    }
  }
}

// Create DOM based on node type.
const createDOM = (fiberNode) => {
  const { type, props } = fiberNode
  let DOM = null;

  if (type === 'TEXT') {
    DOM = document.createTextNode('')
  } else if (typeof type === 'string') {
    DOM = document.createElement(type)
  }

  // Update properties based on props after creation.
  if (DOM !== null) {
    updateDOM(DOM, {}, props)
  }

  return DOM
}


// Change the DOM based on fiber node changes.
// Note that we must complete the comparison of all fiber nodes before commitRoot.
// The comparison of fiber nodes can be interrupted, but the commitRoot cannot be interrupted.
const commitRoot = () => {
  const findParentFiber = (fiberNode) => {
    if (fiberNode) {
      let parentFiber = fiberNode.return
      while (parentFiber && !parentFiber.dom) {
        parentFiber = parentFiber.return
      }
      return parentFiber
    }

    return null
  }

  const commitDeletion = (parentDOM, DOM) => {
    if (isDef(parentDOM)) {
      parentDOM.removeChild(DOM)
    }
  }

  const commitReplacement = (parentDOM, DOM) => {
    if (isDef(parentDOM)) {
      parentDOM.appendChild(DOM)
    }
  }

  const commitWork = (fiberNode) => {
    if (fiberNode) {
      if (fiberNode.dom) {
        const parentFiber = findParentFiber(fiberNode)
        const parentDOM = parentFiber?.dom

        switch (fiberNode.effectTag) {
          case 'REPLACEMENT':
            commitReplacement(parentDOM, fiberNode.dom)
            break
          case 'UPDATE':
            updateDOM(
              fiberNode.dom,
              fiberNode.alternate ? fiberNode.alternate.props : {},
              fiberNode.props,
            )
            break
          default:
            break
        }
      }

      commitWork(fiberNode.child)
      commitWork(fiberNode.sibling)
    }
  }

  for (const deletion of deletions) {
    if (deletion.dom) {
      const parentFiber = findParentFiber(deletion)
      commitDeletion(parentFiber?.dom, deletion.dom)
    }
  }

  if (wipRoot !== null) {
    commitWork(wipRoot.child)
    currentRoot = wipRoot
  }

  wipRoot = null
}

// Reconcile the fiber nodes before and after, compare and record the differences.
const reconcileChildren = (fiberNode, elements = [],) => {
  let index = 0
  let oldFiberNode = undefined
  let prevSibling = undefined
  const virtualElements = elements.flat(Infinity)

  if (fiberNode.alternate?.child) {
    oldFiberNode = fiberNode.alternate.child
  }

  while (
    index < virtualElements.length ||
    typeof oldFiberNode !== 'undefined'
  ) {
    const virtualElement = virtualElements[index]
    let newFiber = undefined

    const isSameType = Boolean(
      oldFiberNode &&
        virtualElement &&
        oldFiberNode.type === virtualElement.type,
    )

    if (isSameType && oldFiberNode) {
      newFiber = {
        type: oldFiberNode.type,
        dom: oldFiberNode.dom,
        alternate: oldFiberNode,
        props: virtualElement.props,
        return: fiberNode,
        effectTag: 'UPDATE',
      }
    }
    if (!isSameType && Boolean(virtualElement)) {
      newFiber = {
        type: virtualElement.type,
        dom: null,
        alternate: null,
        props: virtualElement.props,
        return: fiberNode,
        effectTag: 'REPLACEMENT',
      }
    }
    if (!isSameType && oldFiberNode) {
      deletions.push(oldFiberNode);
    }

    if (oldFiberNode) {
      oldFiberNode = oldFiberNode.sibling;
    }

    if (index === 0) {
      fiberNode.child = newFiber
    } else if (typeof prevSibling !== 'undefined') {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index += 1
  }
}

// Execute each unit task and return to the next unit task.
// Different processing according to the type of fiber node.
const performUnitOfWork = (fiberNode) => {
  
  const { type } = fiberNode
  switch (typeof type) {
    case 'function': {
      wipFiber = fiberNode
      wipFiber.hooks = []
      hookIndex = 0
      let children
      
      if (typeof(type.sjdon) === 'function') {
        children = type.sjdon(fiberNode.props)
      } else {
        children = type(fiberNode.props)
      }
      
      // begin: added for SJDON
      // if (Array.isArray(children) && children[0]===undefined) {
      //   children = parseSJDON(children.slice(1))
      // }
      // end: added for SJDON 
      
      reconcileChildren(fiberNode, [
        isVirtualElement(children)
          ? children
          : createTextElement(String(children)),
      ])
      break
    }

    case 'number':
    case 'string':
      if (!fiberNode.dom) {
        fiberNode.dom = createDOM(fiberNode)
      }
      reconcileChildren(fiberNode, fiberNode.props.children)
      break
    case 'symbol':
      if (type === Fragment) {
        reconcileChildren(fiberNode, fiberNode.props.children)
      }
      break
    default:
      if (typeof fiberNode.props !== 'undefined') {
        reconcileChildren(fiberNode, fiberNode.props.children)
      }
      break
  }

  if (fiberNode.child) {
    return fiberNode.child
  }

  let nextFiberNode = fiberNode

  while (typeof nextFiberNode !== 'undefined') {
    if (nextFiberNode.sibling) {
      return nextFiberNode.sibling
    }

    nextFiberNode = nextFiberNode.return
  }

  return null
}

// Use requestIdleCallback to query whether there is currently a unit task
// and determine whether the DOM needs to be updated.
const workLoop = (deadline) => {
  while (nextUnitOfWork && deadline.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  window.requestIdleCallback(workLoop)
}

// Initial or reset.
const render = (element, container) => {
  
  // begin: added for SJDON
  if (Array.isArray(element)) {
    element = parseSJDON(element)
  }
  // end: added for SJDON
  
  currentRoot = null
  wipRoot = {
    type: 'div',
    dom: container,
    props: {
      children: [{ ...element }],
    },
    alternate: currentRoot,
  }
  nextUnitOfWork = wipRoot
  deletions = []
}

// Associate the hook with the fiber node.
function useState(initState) {
  const fiberNode = wipFiber
  const hook = fiberNode?.alternate?.hooks
    ? fiberNode.alternate.hooks[hookIndex]
    : {
        state: initState,
        queue: [],
      }

  while (hook.queue.length) {
    let newState = hook.queue.shift()
    if (isPlainObject(hook.state) && isPlainObject(newState)) {
      newState = { ...hook.state, ...newState };
    }
    if (isDef(newState)) {
      hook.state = newState
    }
  }

  if (typeof fiberNode.hooks === 'undefined') {
    fiberNode.hooks = [];
  }

  fiberNode.hooks.push(hook)
  hookIndex += 1

  const setState = (value) => {
    hook.queue.push(value)
    if (currentRoot) {
      wipRoot = {
        type: currentRoot.type,
        dom: currentRoot.dom,
        props: currentRoot.props,
        alternate: currentRoot,
      }
      nextUnitOfWork = wipRoot
      deletions = []
      currentRoot = null
    }
  }

  return [hook.state, setState]
}

// Start the engine!
void (function main() {
  window.requestIdleCallback(workLoop)
})()


function parseSJDON ([type=Fragment, ...rest]) {
  const isObj = (obj) =>
    typeof(obj)==='object'
      && !Array.isArray(obj)
      && obj.sjdon !== "noprops"
  const props = Object.assign({}, ...rest.filter(isObj))
  const children = rest.filter(item => !isObj(item))
  
  if (props.style !== undefined) {
    props.style = combineStyles(props.style)
  }

  const repr = createElement(type, props,
    ...children.map(ch => Array.isArray(ch) ? parseSJDON(ch) : ch)
  )
  return repr
}


function useSJDON (...funcs) {
  for (let f of funcs) {
    const fres = (...args) => parseSJDON(f(...args))
    f.sjdon = fres
  }
}


// temporary solution for merging styles
// (should be thoroughly tested and probably improved) 

function str2obj (str) {
  return str.split(";")
    .map(it=>it.trim())
    .map(it=>it.split(":"))
    .reduce((obj, [key,val]) => {if (key.trim()) obj[key.trim()]=val.trim();return obj}, {})
}

function combineStyles (styles) {
  let styleObj = {}
  if (typeof(styles)=="string") {
    return styles
  } else if (Array.isArray(styles)) {
    let stylesArr = styles.map(s => typeof(s)==='string' ? str2obj(s) : s)
    styleObj = Object.assign({}, ...stylesArr)
  } else if (typeof(styles)=="object") {
    styleObj = styles
  } else {
    return ""
  }
  let style = ""
  for (const key of Object.keys(styleObj)) {
    style += key + ":" + styleObj[key] + ";"
  }
  return style.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}
  

export {
  createElement,
  render,
  useState,
  Fragment,
  parseSJDON,
  useSJDON,
  combineStyles,
}
