import { useGetAllEmails } from "@hooks/useGetConversations";

const Home = () => {
  useGetAllEmails("1");

  return (
    <div className="w-full h-full text-black">
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
    </div>
  );
};

export default Home;
