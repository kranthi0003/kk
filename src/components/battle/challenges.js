// 20 JavaScript coding challenges with test cases
const CHALLENGES = [
  {
    id: 1, difficulty: 'Easy', title: 'Reverse String',
    desc: 'Write a function that reverses a string.',
    template: 'function reverseString(str) {\n  // your code here\n}',
    tests: [
      { input: '"hello"', expected: '"olleh"', fn: 'reverseString("hello")' },
      { input: '"world"', expected: '"dlrow"', fn: 'reverseString("world")' },
      { input: '""', expected: '""', fn: 'reverseString("")' },
    ],
  },
  {
    id: 2, difficulty: 'Easy', title: 'FizzBuzz',
    desc: 'Return an array from 1 to n. Multiples of 3→"Fizz", 5→"Buzz", both→"FizzBuzz".',
    template: 'function fizzBuzz(n) {\n  // your code here\n}',
    tests: [
      { input: '5', expected: '[1,2,"Fizz",4,"Buzz"]', fn: 'JSON.stringify(fizzBuzz(5))' },
      { input: '15', expected: '"FizzBuzz"', fn: 'fizzBuzz(15)[14]' },
    ],
  },
  {
    id: 3, difficulty: 'Easy', title: 'Palindrome Check',
    desc: 'Return true if the string is a palindrome (ignore case & non-alpha).',
    template: 'function isPalindrome(str) {\n  // your code here\n}',
    tests: [
      { input: '"racecar"', expected: 'true', fn: 'isPalindrome("racecar")' },
      { input: '"hello"', expected: 'false', fn: 'isPalindrome("hello")' },
      { input: '"A man a plan a canal Panama"', expected: 'true', fn: 'isPalindrome("A man a plan a canal Panama")' },
    ],
  },
  {
    id: 4, difficulty: 'Easy', title: 'Two Sum',
    desc: 'Return indices of two numbers that add up to target.',
    template: 'function twoSum(nums, target) {\n  // your code here\n}',
    tests: [
      { input: '[2,7,11,15], 9', expected: '[0,1]', fn: 'JSON.stringify(twoSum([2,7,11,15], 9))' },
      { input: '[3,2,4], 6', expected: '[1,2]', fn: 'JSON.stringify(twoSum([3,2,4], 6))' },
    ],
  },
  {
    id: 5, difficulty: 'Easy', title: 'Count Vowels',
    desc: 'Return the count of vowels (a, e, i, o, u) in a string.',
    template: 'function countVowels(str) {\n  // your code here\n}',
    tests: [
      { input: '"hello"', expected: '2', fn: 'countVowels("hello")' },
      { input: '"aeiou"', expected: '5', fn: 'countVowels("aeiou")' },
      { input: '"xyz"', expected: '0', fn: 'countVowels("xyz")' },
    ],
  },
  {
    id: 6, difficulty: 'Easy', title: 'Capitalize Words',
    desc: 'Capitalize the first letter of each word.',
    template: 'function capitalize(str) {\n  // your code here\n}',
    tests: [
      { input: '"hello world"', expected: '"Hello World"', fn: 'capitalize("hello world")' },
      { input: '"javaScript is fun"', expected: '"JavaScript Is Fun"', fn: 'capitalize("javaScript is fun")' },
    ],
  },
  {
    id: 7, difficulty: 'Medium', title: 'Flatten Array',
    desc: 'Flatten a deeply nested array into a single-level array.',
    template: 'function flatten(arr) {\n  // your code here\n}',
    tests: [
      { input: '[1,[2,[3,[4]]]]', expected: '[1,2,3,4]', fn: 'JSON.stringify(flatten([1,[2,[3,[4]]]]))' },
      { input: '[[1,2],[3,4]]', expected: '[1,2,3,4]', fn: 'JSON.stringify(flatten([[1,2],[3,4]]))' },
    ],
  },
  {
    id: 8, difficulty: 'Medium', title: 'Anagram Check',
    desc: 'Return true if two strings are anagrams (ignore case/spaces).',
    template: 'function isAnagram(a, b) {\n  // your code here\n}',
    tests: [
      { input: '"listen", "silent"', expected: 'true', fn: 'isAnagram("listen", "silent")' },
      { input: '"hello", "world"', expected: 'false', fn: 'isAnagram("hello", "world")' },
    ],
  },
  {
    id: 9, difficulty: 'Medium', title: 'Valid Parentheses',
    desc: 'Return true if brackets are valid: (), [], {}',
    template: 'function isValid(s) {\n  // your code here\n}',
    tests: [
      { input: '"()[]{}"', expected: 'true', fn: 'isValid("()[]{}")' },
      { input: '"(]"', expected: 'false', fn: 'isValid("(]")' },
      { input: '"{[]}"', expected: 'true', fn: 'isValid("{[]}")' },
    ],
  },
  {
    id: 10, difficulty: 'Medium', title: 'Longest Substring',
    desc: 'Length of longest substring without repeating characters.',
    template: 'function lengthOfLongestSubstring(s) {\n  // your code here\n}',
    tests: [
      { input: '"abcabcbb"', expected: '3', fn: 'lengthOfLongestSubstring("abcabcbb")' },
      { input: '"bbbbb"', expected: '1', fn: 'lengthOfLongestSubstring("bbbbb")' },
      { input: '"pwwkew"', expected: '3', fn: 'lengthOfLongestSubstring("pwwkew")' },
    ],
  },
  {
    id: 11, difficulty: 'Medium', title: 'Find Duplicates',
    desc: 'Return array of duplicate values.',
    template: 'function findDuplicates(arr) {\n  // your code here\n}',
    tests: [
      { input: '[1,2,3,2,1]', expected: '[1,2]', fn: 'JSON.stringify(findDuplicates([1,2,3,2,1]).sort())' },
      { input: '[1,2,3]', expected: '[]', fn: 'JSON.stringify(findDuplicates([1,2,3]))' },
    ],
  },
  {
    id: 12, difficulty: 'Medium', title: 'Deep Clone',
    desc: 'Deep clone an object (no circular refs).',
    template: 'function deepClone(obj) {\n  // your code here\n}',
    tests: [
      { input: '{a:1, b:{c:2}}', expected: '2', fn: 'deepClone({a:1, b:{c:2}}).b.c' },
      { input: 'mutation check', expected: 'false', fn: '(() => { const o = {a:{b:1}}; const c = deepClone(o); c.a.b = 2; return o.a.b === 2 })()' },
    ],
  },
  {
    id: 13, difficulty: 'Medium', title: 'Chunk Array',
    desc: 'Split an array into chunks of given size.',
    template: 'function chunk(arr, size) {\n  // your code here\n}',
    tests: [
      { input: '[1,2,3,4,5], 2', expected: '[[1,2],[3,4],[5]]', fn: 'JSON.stringify(chunk([1,2,3,4,5], 2))' },
      { input: '[1,2,3], 1', expected: '[[1],[2],[3]]', fn: 'JSON.stringify(chunk([1,2,3], 1))' },
    ],
  },
  {
    id: 14, difficulty: 'Medium', title: 'Array Intersection',
    desc: 'Return common elements of two arrays.',
    template: 'function intersection(a, b) {\n  // your code here\n}',
    tests: [
      { input: '[1,2,3], [2,3,4]', expected: '[2,3]', fn: 'JSON.stringify(intersection([1,2,3], [2,3,4]).sort())' },
      { input: '[1,2], [3,4]', expected: '[]', fn: 'JSON.stringify(intersection([1,2], [3,4]))' },
    ],
  },
  {
    id: 15, difficulty: 'Medium', title: 'Group Anagrams',
    desc: 'Group strings into arrays of anagrams.',
    template: 'function groupAnagrams(strs) {\n  // your code here\n}',
    tests: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expected: '3', fn: 'groupAnagrams(["eat","tea","tan","ate","nat","bat"]).length' },
    ],
  },
  {
    id: 16, difficulty: 'Hard', title: 'Memoize Function',
    desc: 'Implement memoize that caches function results.',
    template: 'function memoize(fn) {\n  // your code here\n}',
    tests: [
      { input: 'memoize(x => x*2)(5)', expected: '10', fn: '(() => { const m = memoize(x => x*2); m(5); return m(5) })()' },
    ],
  },
  {
    id: 17, difficulty: 'Hard', title: 'Curry Function',
    desc: 'Convert f(a,b,c) into f(a)(b)(c).',
    template: 'function curry(fn) {\n  // your code here\n}',
    tests: [
      { input: 'curry(sum)(1)(2)(3)', expected: '6', fn: 'curry((a,b,c) => a+b+c)(1)(2)(3)' },
    ],
  },
  {
    id: 18, difficulty: 'Hard', title: 'Event Emitter',
    desc: 'Implement EventEmitter with on(), emit(), off().',
    template: 'class EventEmitter {\n  constructor() {\n    // your code\n  }\n  on(event, fn) {}\n  emit(event, ...args) {}\n  off(event, fn) {}\n}',
    tests: [
      { input: 'on + emit', expected: '42', fn: '(() => { const e = new EventEmitter(); let v; e.on("test", x => v=x); e.emit("test", 42); return v })()' },
    ],
  },
  {
    id: 19, difficulty: 'Hard', title: 'Throttle Function',
    desc: 'Implement throttle: fn called at most once per ms milliseconds.',
    template: 'function throttle(fn, ms) {\n  // your code here\n}',
    tests: [
      { input: 'throttle', expected: '"function"', fn: 'typeof throttle(() => {}, 100)' },
    ],
  },
  {
    id: 20, difficulty: 'Hard', title: 'LRU Cache',
    desc: 'Implement an LRU cache with get(key) and put(key, value) with max capacity.',
    template: 'class LRUCache {\n  constructor(capacity) {\n    // your code\n  }\n  get(key) {}\n  put(key, value) {}\n}',
    tests: [
      { input: 'put + get', expected: '1', fn: '(() => { const c = new LRUCache(2); c.put("a",1); return c.get("a") })()' },
      { input: 'eviction', expected: '-1', fn: '(() => { const c = new LRUCache(2); c.put("a",1); c.put("b",2); c.put("c",3); return c.get("a") ?? -1 })()' },
    ],
  },
]

export default CHALLENGES
