import { navigationItems } from "./navigation";

export function getToolById(id: string) {
  for (const section of navigationItems) {
    const tool = section.items.find((item) => item.id === id);
    if (tool) return { ...tool, sectionTitle: section.title };
  }
  return null;
}
