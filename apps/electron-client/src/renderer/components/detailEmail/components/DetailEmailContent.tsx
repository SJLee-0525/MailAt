const DetailEmailContent = ({ body }: { body: string }) => {
  return (
    <div className="flex items-center justify-center w-full h-fit p-2 rounded-lg">
      <div className="w-1/2 h-fit min-h-[30vh] p-2 font-pre-medium">
        <div dangerouslySetInnerHTML={{ __html: body }}></div>
      </div>
    </div>
  );
};

export default DetailEmailContent;
