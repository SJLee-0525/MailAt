function removeStylesFromHtml(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;
  // <style> 태그를 제거
  const styles = div.querySelectorAll("style");
  styles.forEach((style) => style.remove());
  return div.innerHTML;
}

const DetailEmailContent = ({ body }: { body: string }) => {
  const sanitizedBody = removeStylesFromHtml(body);

  return (
    <div className="flex items-center justify-center w-full h-fit p-2 rounded-lg">
      <div className="w-1/2 h-fit min-h-[30vh] p-2 font-pre-medium">
        <div dangerouslySetInnerHTML={{ __html: sanitizedBody }}></div>
      </div>
    </div>
  );
};

export default DetailEmailContent;
