export interface Person {
  id: string
  name: string
  role: string
  type: "individual" | "studio" | "agency"
  url: string
  tags: string[]
  image: string
}

