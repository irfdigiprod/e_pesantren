import { ref } from "vue";

const showHeader = ref(true);
const showBottomNav = ref(true);

export function useMobileLayout() {
  function setShowHeader(value) {
    showHeader.value = value;
  }

  function setShowBottomNav(value) {
    showBottomNav.value = value;
  }

  function resetLayout() {
    showHeader.value = true;
    showBottomNav.value = true;
  }

  return {
    showHeader,
    showBottomNav,
    setShowHeader,
    setShowBottomNav,
    resetLayout,
  };
}
