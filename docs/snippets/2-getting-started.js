<script>
document.addEventListener('DOMContentLoaded', function() {
  try {
    dynatrace.sendBizEvent('page_view', {
      "page": "BizObs Journey Simulator - Getting Started",
      "section": "Documentation",
      "application": "Dynatrace BizObs Journey Simulator",
      "url": window.location.href
    });
  } catch (error) {
    console.log("BizEvent tracking not available:", error);
  }
});
</script>