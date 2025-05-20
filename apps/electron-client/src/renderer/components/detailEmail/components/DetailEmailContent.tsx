function removeStylesFromHtml(html: string) {
  const div = document.createElement("div");
  div.innerHTML = html;

  // ❶ <style> 태그 제거
  div.querySelectorAll("style").forEach((style) => style.remove());

  // ❷ 모든 <a> 태그가 새 창(탭)에서 열리도록 설정
  div.querySelectorAll<HTMLAnchorElement>("a").forEach((anchor) => {
    anchor.setAttribute("target", "_blank");
    // 보안을 위해 noopener‧noreferrer 추가
    anchor.setAttribute("rel", "noopener noreferrer");
  });

  return div.innerHTML;
}

const DetailEmailContent = ({ body }: { body: string }) => {
  const sanitizedBody = removeStylesFromHtml(body);

  return (
    <div className="flex items-center justify-center w-full h-fit p-2 rounded-lg">
      <div className="flex justify-center w-full h-fit min-h-[30vh] p-2 font-pre-medium text-[#000000] bg-[#ffffff]">
        <div dangerouslySetInnerHTML={{ __html: sanitizedBody }}></div>
      </div>
    </div>
  );
};

export default DetailEmailContent;
