export interface Language {
  readonly name: string
  readonly color: string
}

const DEFAULT_COLOR = '#8b949e'

export const LANGUAGES: readonly Language[] = [
  { name: 'JavaScript', color: '#f1e05a' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Python', color: '#3572A5' },
  { name: 'Java', color: '#b07219' },
  { name: 'C', color: '#555555' },
  { name: 'C++', color: '#f34b7d' },
  { name: 'C#', color: '#178600' },
  { name: 'Go', color: '#00ADD8' },
  { name: 'Rust', color: '#dea584' },
  { name: 'Ruby', color: '#701516' },
  { name: 'PHP', color: '#4F5D95' },
  { name: 'Swift', color: '#F05138' },
  { name: 'Kotlin', color: '#A97BFF' },
  { name: 'Dart', color: '#00B4AB' },
  { name: 'HTML', color: '#e34c26' },
  { name: 'CSS', color: '#563d7c' },
  { name: 'Shell', color: '#89e051' },
  { name: 'Lua', color: '#000080' },
  { name: 'R', color: '#198CE7' },
  { name: 'Scala', color: '#c22d40' },
  { name: 'Objective-C', color: '#438eff' },
  { name: 'Haskell', color: '#5e5086' },
  { name: 'Elixir', color: '#6e4a7e' },
  { name: 'Erlang', color: '#b83998' },
  { name: 'Clojure', color: '#db5855' },
  { name: 'Julia', color: '#a270ba' },
  { name: 'Perl', color: '#0298c3' },
  { name: 'PowerShell', color: '#012456' },
  { name: 'Groovy', color: '#4298b8' },
  { name: 'F#', color: '#b845fc' },
  { name: 'OCaml', color: '#ef7a08' },
  { name: 'Zig', color: '#ec915c' },
  { name: 'Solidity', color: '#AA6746' },
  { name: 'MATLAB', color: '#e16737' },
  { name: 'Assembly', color: '#6E4C13' },
  { name: 'CUDA', color: '#3A4E3A' },
  { name: 'Vue', color: '#41b883' },
  { name: 'Svelte', color: '#ff3e00' },
  { name: 'Vim script', color: '#199f4b' },
  { name: 'Dockerfile', color: '#384d54' },
  { name: 'Makefile', color: '#427819' },
  { name: 'Markdown', color: '#083fa1' },
] as const

export function getLanguageColor(languageName: string): string {
  return LANGUAGES.find((language) => language.name === languageName)?.color ?? DEFAULT_COLOR
}
