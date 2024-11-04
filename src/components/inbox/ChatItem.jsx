export default function ChatItem({ avatar, name, lastMessage, lastTime }) {
  return (
    <>
      <img
        className="object-cover w-10 h-10 rounded-full"
        src={avatar}
        alt={name}
      />
      <div className="w-full pb-2 hidden md:block">
        <div className="flex justify-between">
          <span className="block ml-2 font-semibold text-gray-600">{name}</span>
          <span className="block ml-2 text-sm text-gray-600">{lastTime}</span>
        </div>
        <span className="block ml-2 text-sm text-gray-600">{lastMessage}</span>
      </div>
    </>
  );
}
