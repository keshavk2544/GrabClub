import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createRipple(event: React.MouseEvent<HTMLElement>) {
  const element = event.currentTarget;

  const circle = document.createElement("span");
  const diameter = Math.max(element.clientWidth, element.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - element.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${event.clientY - element.getBoundingClientRect().top - radius}px`;
  circle.classList.add("ripple");

  const existingRipple = element.getElementsByClassName("ripple")[0];
  if (existingRipple) {
    existingRipple.remove();
  }

  element.appendChild(circle);
  
  setTimeout(() => {
    if (circle.parentNode) {
      circle.remove();
    }
  }, 600);
}
